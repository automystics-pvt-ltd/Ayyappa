import { Router } from "express";
import { db } from "@workspace/db";
import { eventsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

// GET /api/events — public
router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.published, true))
      .orderBy(desc(eventsTable.eventDate));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET /api/events/all — admin
router.get("/all", requireAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.eventDate));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST /api/events
router.post("/", requireRole("super_admin", "editor"), async (req, res) => {
  const session = (req as any).session;
  const { title, eventType, description, eventDate, location, posterUrl, published } = req.body;
  if (!title || !eventDate) {
    res.status(400).json({ error: "Title and date required" });
    return;
  }
  try {
    const [event] = await db
      .insert(eventsTable)
      .values({ title, eventType, description, eventDate: new Date(eventDate), location, posterUrl, published: published !== false, createdBy: session.adminId })
      .returning();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

// PATCH /api/events/:id
router.patch("/:id", requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  const { title, eventType, description, eventDate, location, posterUrl, published } = req.body;
  try {
    const [updated] = await db
      .update(eventsTable)
      .set({ title, eventType, description, eventDate: eventDate ? new Date(eventDate) : undefined, location, posterUrl, published, updatedAt: new Date() })
      .where(eq(eventsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

// DELETE /api/events/:id
router.delete("/:id", requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(eventsTable).where(eq(eventsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
