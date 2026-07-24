import { Router } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { ObjectStorageService } from "../lib/objectStorage";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_QR_SIZE = 5 * 1024 * 1024;
const objectStorageService = new ObjectStorageService();

const router = Router();

// POST /api/settings/upload-qr-url — admin only, presigned URL for QR code image
router.post("/upload-qr-url", requireRole("super_admin", "editor"), async (req, res) => {
  const { size, contentType } = req.body ?? {};
  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
    res.status(400).json({ error: "Only image files are allowed (JPEG, PNG, WebP, GIF)" });
    return;
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_QR_SIZE) {
    res.status(400).json({ error: "File size must be between 1 byte and 5 MB" });
    return;
  }
  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath });
  } catch (err) {
    req.log.error({ err }, "Error generating QR upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// GET /api/settings — public
router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable);
    const settings: Record<string, string | null> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PATCH /api/settings — super_admin / editor
router.patch("/", requireRole("super_admin", "editor"), async (req, res) => {
  const session = (req as any).session;
  const updates = req.body as Record<string, string>;
  try {
    for (const [key, value] of Object.entries(updates)) {
      await db
        .insert(siteSettingsTable)
        .values({ key, value, updatedBy: session.adminId, updatedAt: new Date() })
        .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedBy: session.adminId, updatedAt: new Date() } });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
