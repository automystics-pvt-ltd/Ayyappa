import { Router } from "express";
import { db } from "@workspace/db";
import { donationsTable } from "@workspace/db/schema";
import { eq, desc, sum, count, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

// POST /api/donations — public, submit a donation
router.post("/", async (req, res) => {
  const { donorName, mobile, amount, transactionId, screenshotUrl, anonymous, message } = req.body;

  if (!donorName || !mobile || !amount || !transactionId) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }

  try {
    const [donation] = await db
      .insert(donationsTable)
      .values({ donorName, mobile, amount: String(amount), transactionId, screenshotUrl, anonymous: !!anonymous, message })
      .returning();
    res.json(donation);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit donation" });
  }
});

// GET /api/donations/stats — public, crowdfunding stats
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
    const goal = 5000000;

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

// GET /api/donations/approved — public, approved donors list
router.get("/approved", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: donationsTable.id,
        donorName: donationsTable.donorName,
        amount: donationsTable.amount,
        anonymous: donationsTable.anonymous,
        createdAt: donationsTable.createdAt,
        reviewedAt: donationsTable.reviewedAt,
      })
      .from(donationsTable)
      .where(eq(donationsTable.status, "approved"))
      .orderBy(desc(donationsTable.reviewedAt))
      .limit(100);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch donors" });
  }
});

// GET /api/donations — admin, all donations
router.get("/", requireAuth, async (req, res) => {
  const { status } = req.query;
  try {
    const conditions = status ? [eq(donationsTable.status, String(status))] : [];
    const rows = await db
      .select()
      .from(donationsTable)
      .where(conditions.length ? conditions[0] : undefined)
      .orderBy(desc(donationsTable.createdAt));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

// PATCH /api/donations/:id/approve — admin (not volunteer)
router.patch("/:id/approve", requireRole("super_admin", "editor"), async (req, res) => {
  const session = (req as any).session;
  const id = Number(req.params.id);

  try {
    const [updated] = await db
      .update(donationsTable)
      .set({ status: "approved", reviewedBy: session.adminId, reviewedAt: new Date() })
      .where(eq(donationsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Donation not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to approve donation" });
  }
});

// PATCH /api/donations/:id/reject — admin (not volunteer)
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

    if (!updated) {
      res.status(404).json({ error: "Donation not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to reject donation" });
  }
});

// DELETE /api/donations/:id — super_admin only
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
