import { Router } from "express";
import { db } from "@workspace/db";
import { newsPostsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

// GET /api/news — public, published posts
router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(newsPostsTable)
      .where(eq(newsPostsTable.published, true))
      .orderBy(desc(newsPostsTable.createdAt));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// GET /api/news/all — admin, all posts
router.get("/all", requireAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(newsPostsTable).orderBy(desc(newsPostsTable.createdAt));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// POST /api/news — admin (editor+)
router.post("/", requireRole("super_admin", "editor"), async (req, res) => {
  const session = (req as any).session;
  const { title, content, imageUrl, videoUrl, published } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: "Title and content required" });
    return;
  }
  try {
    const [post] = await db
      .insert(newsPostsTable)
      .values({ title, content, imageUrl, videoUrl, published: published !== false, createdBy: session.adminId })
      .returning();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// PATCH /api/news/:id
router.patch("/:id", requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  const { title, content, imageUrl, videoUrl, published } = req.body;
  try {
    const [updated] = await db
      .update(newsPostsTable)
      .set({ title, content, imageUrl, videoUrl, published, updatedAt: new Date() })
      .where(eq(newsPostsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update post" });
  }
});

// DELETE /api/news/:id
router.delete("/:id", requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(newsPostsTable).where(eq(newsPostsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
