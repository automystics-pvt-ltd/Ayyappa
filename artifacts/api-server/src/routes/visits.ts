import { Router } from "express";
import { db } from "@workspace/db";
import { visitsTable } from "@workspace/db/schema";
import { count, eq, isNotNull } from "drizzle-orm";

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
      // Await the session save so that the next request (e.g. a page refresh
      // arriving immediately after this 204) finds lastVisitDay already in the
      // PG session store. Fire-and-forget was a race: the response could be sent
      // before connect-pg-simple finished writing.
      await new Promise<void>((resolve) => sess.save(() => resolve()));
    }
    res.status(204).end();
  } catch (err) {
    req.log?.error({ err }, "visits/track failed");
    res.status(500).json({ error: "Failed to record visit" });
  }
});

// GET /api/visits/count — public total + today's count for the site footer.
// Only count rows with a day_key; legacy rows (from the old ip-based schema) have NULL.
router.get("/count", async (_req, res) => {
  try {
    const day = todayKey();
    const [totalRow] = await db
      .select({ cnt: count() })
      .from(visitsTable)
      .where(isNotNull(visitsTable.dayKey));
    const [todayRow] = await db
      .select({ cnt: count() })
      .from(visitsTable)
      .where(eq(visitsTable.dayKey, day));
    res.json({
      total: Number(totalRow?.cnt ?? 0),
      today: Number(todayRow?.cnt ?? 0),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch visitor count" });
  }
});

export { todayKey };
export default router;
