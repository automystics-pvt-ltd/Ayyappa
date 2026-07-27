import { Router } from "express";
import { db } from "@workspace/db";
import { visitsTable } from "@workspace/db/schema";
import { count, eq } from "drizzle-orm";

const router = Router();

// Day bucket in IST (temple's local timezone)
function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date()); // YYYY-MM-DD
}

// POST /api/visits/track — public; one count per session per day
router.post("/track", async (req, res) => {
  try {
    const day = todayKey();
    const sess = req.session as typeof req.session & {
      lastVisitDay?: string;
    };
    // Only insert once per session per calendar day
    if (!sess.lastVisitDay || sess.lastVisitDay !== day) {
      await db.insert(visitsTable).values({ dayKey: day });
      // Mark session so we don't double-count on refresh
      sess.lastVisitDay = day;
      // Fire-and-forget session save — don't block the response on it.
      // express-session will also try to auto-save at response end, but
      // with saveUninitialized:false we need at least one explicit save.
      sess.save(() => { /* ignore errors — visit is already recorded in DB */ });
    }
    res.status(204).end();
  } catch (err) {
    req.log?.error({ err }, "visits/track failed");
    res.status(500).json({ error: "Failed to record visit" });
  }
});

// GET /api/visits/count — public total for the site footer
router.get("/count", async (_req, res) => {
  try {
    const [row] = await db.select({ cnt: count() }).from(visitsTable);
    res.json({ total: Number(row?.cnt ?? 0) });
  } catch {
    res.status(500).json({ error: "Failed to fetch visitor count" });
  }
});

export { todayKey };
export default router;
