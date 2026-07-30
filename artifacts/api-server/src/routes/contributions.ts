import { Router } from "express";
import { db } from "@workspace/db";
import { inKindContributionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "../middlewares/auth";

const router = Router();

// GET /api/contributions/all — admin only, all rows
router.get("/all", requireRole("super_admin", "editor", "volunteer"), async (_req, res) => {
  try {
    const rows = await db.select()
      .from(inKindContributionsTable)
      .orderBy(desc(inKindContributionsTable.contributedAt));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

// GET /api/contributions — public, active only
router.get("/", async (_req, res) => {
  try {
    const rows = await db.select()
      .from(inKindContributionsTable)
      .where(eq(inKindContributionsTable.isActive, true))
      .orderBy(desc(inKindContributionsTable.contributedAt));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

// POST /api/contributions — admin
router.post("/", requireRole("super_admin", "editor"), async (req, res) => {
  const session = (req as any).session;
  const { donorName, place, description, contributedAt } = req.body ?? {};
  if (!donorName?.trim() || !description?.trim()) {
    res.status(400).json({ error: "donorName and description are required" });
    return;
  }
  try {
    const [row] = await db.insert(inKindContributionsTable)
      .values({
        donorName:     donorName.trim(),
        place:         place?.trim() || null,
        description:   description.trim(),
        contributedAt: contributedAt ? new Date(contributedAt) : new Date(),
        createdBy:     session.adminId,
      })
      .returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to create contribution" });
  }
});

// PATCH /api/contributions/:id — admin
router.patch("/:id", requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  const { donorName, place, description, contributedAt, isActive } = req.body ?? {};
  try {
    const updates: Record<string, unknown> = {};
    if (donorName    !== undefined) updates.donorName    = donorName.trim();
    if (place        !== undefined) updates.place        = place?.trim() || null;
    if (description  !== undefined) updates.description  = description.trim();
    if (contributedAt !== undefined) updates.contributedAt = new Date(contributedAt);
    if (isActive     !== undefined) updates.isActive     = isActive;

    const [row] = await db.update(inKindContributionsTable)
      .set(updates)
      .where(eq(inKindContributionsTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update contribution" });
  }
});

// DELETE /api/contributions/:id — admin
router.delete("/:id", requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(inKindContributionsTable)
      .where(eq(inKindContributionsTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete contribution" });
  }
});

export default router;
