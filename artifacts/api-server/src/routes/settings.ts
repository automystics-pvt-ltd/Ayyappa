import { Router } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

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
