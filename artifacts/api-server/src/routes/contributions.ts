import { Router } from "express";
import { randomUUID } from "crypto";
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
  } catch (err) {
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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

// GET /api/contributions/receipt/:token — public
router.get("/receipt/:token", async (req, res) => {
  const { token } = req.params;
  if (!token || token.length < 10) {
    res.status(400).json({ error: "Invalid receipt token" });
    return;
  }
  try {
    const [row] = await db.select({
      id:            inKindContributionsTable.id,
      receiptToken:  inKindContributionsTable.receiptToken,
      donorName:     inKindContributionsTable.donorName,
      place:         inKindContributionsTable.place,
      description:   inKindContributionsTable.description,
      contributedAt: inKindContributionsTable.contributedAt,
      createdAt:     inKindContributionsTable.createdAt,
      isActive:      inKindContributionsTable.isActive,
    })
    .from(inKindContributionsTable)
    .where(eq(inKindContributionsTable.receiptToken, token))
    .limit(1);

    if (!row) { res.status(404).json({ error: "Receipt not found" }); return; }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Error fetching contribution receipt");
    res.status(500).json({ error: "Failed to fetch receipt" });
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
        receiptToken:  randomUUID(),
        donorName:     donorName.trim(),
        place:         place?.trim() || null,
        description:   description.trim(),
        contributedAt: contributedAt ? new Date(contributedAt) : new Date(),
        createdBy:     session.adminId,
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Error creating contribution");
    res.status(500).json({ error: "Failed to create contribution" });
  }
});

// PATCH /api/contributions/:id — admin
router.patch("/:id", requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  const { donorName, place, description, contributedAt, isActive } = req.body ?? {};
  try {
    const updates: Record<string, unknown> = {};
    if (donorName     !== undefined) updates.donorName    = String(donorName).trim();
    if (place         !== undefined) updates.place        = place?.trim() || null;
    if (description   !== undefined) updates.description  = String(description).trim();
    if (contributedAt !== undefined && contributedAt) updates.contributedAt = new Date(contributedAt);
    if (isActive      !== undefined) updates.isActive     = isActive;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [row] = await db.update(inKindContributionsTable)
      .set(updates)
      .where(eq(inKindContributionsTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Error updating contribution");
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
  } catch (err) {
    req.log.error({ err }, "Error deleting contribution");
    res.status(500).json({ error: "Failed to delete contribution" });
  }
});

export default router;
