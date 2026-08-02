import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { donationsTable, siteSettingsTable } from "@workspace/db/schema";
import { eq, desc, sum, count } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { ObjectStorageService } from "../lib/objectStorage";
import { notifyDonationApproved } from "../lib/smsService";
import {
  isSidecarAvailable,
  createLocalUploadSlot,
  saveLocalUpload,
} from "../lib/localUpload";

const router = Router();
const objectStorageService = new ObjectStorageService();

// Allowed image MIME types for screenshot uploads
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Max screenshot file size: 5 MB
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/donations/upload-screenshot-url
 * Public endpoint — generates a presigned upload URL for a donation screenshot.
 * On Replit: uses GCS presigned URL via sidecar.
 * On production servers without sidecar: falls back to a direct-upload endpoint.
 */
router.post("/upload-screenshot-url", async (req, res) => {
  const { size, contentType } = req.body ?? {};

  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
    res.status(400).json({ error: "Only image files are allowed (JPEG, PNG, WebP, GIF)" });
    return;
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_SCREENSHOT_SIZE) {
    res.status(400).json({ error: "File size must be between 1 byte and 5 MB" });
    return;
  }

  // Try GCS/Replit sidecar first; fall back to local filesystem storage.
  if (await isSidecarAvailable()) {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
      return;
    } catch (err) {
      req.log.warn({ err }, "Sidecar reported available but upload URL failed; falling back to local storage");
    }
  }

  // Local storage fallback — build the absolute base URL from the request
  const proto = req.headers["x-forwarded-proto"] ?? (req.secure ? "https" : "http");
  const host = req.headers.host;
  const apiBase = `${proto}://${host}/api`;
  const slot = createLocalUploadSlot(apiBase);
  res.json(slot);
});

/**
 * PUT /api/donations/local-upload/:id
 * Receives raw file body from the browser and saves it to the local upload directory.
 * This endpoint is only used when the Replit GCS sidecar is not available.
 */
router.put(
  "/local-upload/:id",
  // Parse raw body — limit matches MAX_SCREENSHOT_SIZE
  (req, res, next) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      (req as any).rawBody = Buffer.concat(chunks);
      next();
    });
    req.on("error", next);
  },
  async (req, res) => {
    const { id } = req.params;
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.alloc(0);
    const contentType = (req.headers["content-type"] as string) || "application/octet-stream";

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      res.status(400).json({ error: "Invalid upload ID" });
      return;
    }
    if (rawBody.length === 0) {
      res.status(400).json({ error: "Empty file body" });
      return;
    }
    if (rawBody.length > MAX_SCREENSHOT_SIZE) {
      res.status(413).json({ error: "File too large" });
      return;
    }

    try {
      await saveLocalUpload(id, rawBody, contentType);
      res.status(200).json({ ok: true });
    } catch (err) {
      req.log.error({ err }, "Error saving local upload");
      res.status(500).json({ error: "Failed to save file" });
    }
  }
);

// POST /api/donations — public, submit a donation
router.post("/", async (req, res) => {
  const { donorName, mobile, place, amount, transactionId, screenshotUrl, anonymous, message } = req.body;

  if (!donorName?.trim() || !mobile?.trim() || !amount || !transactionId?.trim()) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: "தொகை சரியாக இல்லை — positive value தேவை" });
    return;
  }
  if (parsedAmount > 10_000_000) {
    res.status(400).json({ error: "தொகை அதிகமாக உள்ளது" });
    return;
  }

  try {
    const [donation] = await db
      .insert(donationsTable)
      .values({
        receiptToken: randomUUID(),
        donorName: donorName.trim(),
        mobile: mobile.trim(),
        place: place?.trim() || null,
        amount: String(amount),
        transactionId: transactionId.trim(),
        screenshotUrl: screenshotUrl || null,
        anonymous: !!anonymous,
        message: message?.trim() || null,
      })
      .returning();
    res.json(donation);
  } catch (err: any) {
    // PostgreSQL unique-constraint violation code: 23505
    if (err?.code === "23505" && err?.constraint?.includes("transaction_id")) {
      res.status(409).json({
        error: "இந்த Transaction ID ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. மீண்டும் சமர்ப்பிக்க வேண்டாம்.",
      });
      return;
    }
    req.log.error({ err }, "Error submitting donation");
    res.status(500).json({ error: "நன்கொடை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." });
  }
});

// POST /api/donations/admin-create — admin only, adds a donor directly as approved/pending
router.post("/admin-create", requireRole("super_admin", "editor"), async (req, res) => {
  const session = (req as any).session;
  const { donorName, mobile, place, amount, transactionId, message, anonymous, status, donationDate } = req.body;

  if (!donorName?.trim() || !mobile?.trim() || !amount) {
    res.status(400).json({ error: "Donor name, mobile, and amount are required" });
    return;
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: "தொகை சரியாக இல்லை — positive value தேவை" });
    return;
  }
  if (parsedAmount > 10_000_000) {
    res.status(400).json({ error: "தொகை அதிகமாக உள்ளது" });
    return;
  }

  const finalStatus = status === "pending" ? "pending" : "approved";
  // Auto-generate a reference ID if no transaction ID is supplied (e.g. cash donations)
  const finalTransactionId = transactionId?.trim() || `ADMIN-${randomUUID()}`;
  const entryDate = donationDate ? new Date(donationDate) : new Date();

  try {
    const [donation] = await db
      .insert(donationsTable)
      .values({
        receiptToken: randomUUID(),
        donorName: donorName.trim(),
        mobile: mobile.trim(),
        place: place?.trim() || null,
        amount: String(parsedAmount),
        transactionId: finalTransactionId,
        anonymous: !!anonymous,
        message: message?.trim() || null,
        status: finalStatus,
        reviewedBy: finalStatus === "approved" ? session.adminId : null,
        reviewedAt: finalStatus === "approved" ? entryDate : null,
        createdAt: entryDate,
      })
      .returning();
    res.json(donation);
  } catch (err: any) {
    if (err?.code === "23505" && err?.constraint?.includes("transaction_id")) {
      res.status(409).json({ error: "இந்த Transaction ID ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது." });
      return;
    }
    req.log.error({ err }, "Error creating admin donation");
    res.status(500).json({ error: "நன்கொடை சேர்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." });
  }
});

// GET /api/donations/stats — public
router.get("/stats", async (_req, res) => {
  try {
    const [totalResult] = await db
      .select({ total: sum(donationsTable.amount), cnt: count() })
      .from(donationsTable)
      .where(eq(donationsTable.status, "approved"));

    const [pendingResult] = await db
      .select({ cnt: count() })
      .from(donationsTable)
      .where(eq(donationsTable.status, "pending"));

    const total = Number(totalResult?.total ?? 0);

    // Read goal from site_settings, fall back to 50 lakh if not set
    const goalRow = await db
      .select({ value: siteSettingsTable.value })
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, "donation_goal"))
      .limit(1);
    const goal = Number(goalRow[0]?.value ?? 5_000_000) || 5_000_000;

    res.json({
      totalRaised: total,
      donorCount: Number(totalResult?.cnt ?? 0),
      pendingCount: Number(pendingResult?.cnt ?? 0),
      goal,
      progressPercent: Math.min(100, Math.round((total / goal) * 100)),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/donations/approved — public
router.get("/approved", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: donationsTable.id,
        donorName: donationsTable.donorName,
        place: donationsTable.place,
        amount: donationsTable.amount,
        anonymous: donationsTable.anonymous,
        message: donationsTable.message,
        reviewedAt: donationsTable.reviewedAt,
        createdAt: donationsTable.createdAt,
      })
      .from(donationsTable)
      .where(eq(donationsTable.status, "approved"))
      .orderBy(desc(donationsTable.reviewedAt))
      .limit(500);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch donors" });
  }
});

// GET /api/donations — admin
router.get("/", requireAuth, async (req, res) => {
  const { status } = req.query;
  try {
    const rows = await db
      .select()
      .from(donationsTable)
      .where(status ? eq(donationsTable.status, String(status)) : undefined)
      .orderBy(desc(donationsTable.createdAt));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

// GET /api/donations/receipt/:token — public, returns donation data for any status
// Token is a non-guessable UUID generated at submission time.
router.get("/receipt/:token", async (req, res) => {
  const { token } = req.params;
  if (!token || token.length < 10) { res.status(400).json({ error: "Invalid receipt token" }); return; }
  try {
    const [donation] = await db
      .select({
        id: donationsTable.id,
        donorName: donationsTable.donorName,
        place: donationsTable.place,
        amount: donationsTable.amount,
        transactionId: donationsTable.transactionId,
        anonymous: donationsTable.anonymous,
        message: donationsTable.message,
        status: donationsTable.status,
        reviewedAt: donationsTable.reviewedAt,
        createdAt: donationsTable.createdAt,
      })
      .from(donationsTable)
      .where(eq(donationsTable.receiptToken, token))
      .limit(1);

    if (!donation) { res.status(404).json({ error: "Receipt not found" }); return; }
    res.json(donation);
  } catch (err) {
    req.log.error({ err }, "Error fetching donation receipt");
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
});

// PATCH /api/donations/:id/approve
router.patch("/:id/approve", requireRole("super_admin", "editor"), async (req, res) => {
  const session = (req as any).session;
  const id = Number(req.params.id);
  try {
    const [updated] = await db
      .update(donationsTable)
      .set({ status: "approved", reviewedBy: session.adminId, reviewedAt: new Date() })
      .where(eq(donationsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Donation not found" }); return; }

    // Send SMS/WhatsApp notification — runs in background, never blocks approval response
    if (updated.mobile) {
      // Prefer explicitly configured SITE_BASE_URL (production domain), fall back to
      // REPLIT_DEV_DOMAIN so the receipt link is always included even in dev/staging.
      const siteBaseUrl =
        process.env.SITE_BASE_URL ||
        (process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : "");
      notifyDonationApproved(
        {
          to: updated.mobile,
          donorName: updated.donorName,
          amount: updated.amount,
          receiptToken: updated.receiptToken ?? "",
          siteBaseUrl: siteBaseUrl || undefined,
        },
        req.log,
      ).catch((err) => req.log.error({ err }, "Unhandled error in notifyDonationApproved"));
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to approve" });
  }
});

// PATCH /api/donations/:id/reject
router.patch("/:id/reject", requireRole("super_admin", "editor"), async (req, res) => {
  const session = (req as any).session;
  const id = Number(req.params.id);
  const { reason } = req.body;
  try {
    const [updated] = await db
      .update(donationsTable)
      .set({ status: "rejected", rejectionReason: reason, reviewedBy: session.adminId, reviewedAt: new Date() })
      .where(eq(donationsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Donation not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to reject" });
  }
});

// DELETE /api/donations/:id
// PATCH /api/donations/:id/donor-name — super_admin only
router.patch("/:id/donor-name", requireRole("super_admin"), async (req, res) => {
  const id = Number(req.params.id);
  const { donorName } = req.body as { donorName?: string };
  if (!donorName?.trim()) {
    res.status(400).json({ error: "Donor name is required" }); return;
  }
  try {
    await db.update(donationsTable).set({ donorName: donorName.trim() }).where(eq(donationsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error updating donor name");
    res.status(500).json({ error: "Failed to update donor name" });
  }
});

router.delete("/:id", requireRole("super_admin"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(donationsTable).where(eq(donationsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
