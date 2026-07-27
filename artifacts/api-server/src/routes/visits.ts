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
    const session = req.session as typeof req.session & {
      lastVisitDay?: string;
    };
    if (session.lastVisitDay !== day) {
      await db.insert(visitsTable).values({ dayKey: day });
      session.lastVisitDay = day;
    }
    res.status(204).end();
  } catch {
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
