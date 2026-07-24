import { Router } from "express";
import { db } from "@workspace/db";
import { galleryAlbumsTable, galleryPhotosTable } from "@workspace/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const objectStorageService = new ObjectStorageService();

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_PHOTO_SIZE = 20 * 1024 * 1024; // 20 MB

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────

// GET /api/gallery/albums — list published albums ordered by sortOrder
router.get("/albums", async (_req, res) => {
  try {
    const albums = await db
      .select()
      .from(galleryAlbumsTable)
      .where(eq(galleryAlbumsTable.published, true))
      .orderBy(asc(galleryAlbumsTable.sortOrder), desc(galleryAlbumsTable.createdAt));
    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

// GET /api/gallery/albums/:albumId/photos — list photos in a published album
router.get("/albums/:albumId/photos", async (req, res) => {
  const albumId = Number(req.params.albumId);
  if (isNaN(albumId)) { res.status(400).json({ error: "Invalid album id" }); return; }
  try {
    // Confirm album is published
    const [album] = await db
      .select()
      .from(galleryAlbumsTable)
      .where(eq(galleryAlbumsTable.id, albumId));
    if (!album || !album.published) { res.status(404).json({ error: "Album not found" }); return; }

    const photos = await db
      .select()
      .from(galleryPhotosTable)
      .where(eq(galleryPhotosTable.albumId, albumId))
      .orderBy(asc(galleryPhotosTable.sortOrder), asc(galleryPhotosTable.createdAt));
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// ─────────────────────────────────────────────
// ADMIN ROUTES (requireAuth + editor/super_admin)
// ─────────────────────────────────────────────

// GET /api/gallery/admin/albums — all albums (published + unpublished) with photo counts
router.get("/admin/albums", requireAuth, requireRole("super_admin", "editor"), async (_req, res) => {
  try {
    const albums = await db
      .select()
      .from(galleryAlbumsTable)
      .orderBy(asc(galleryAlbumsTable.sortOrder), desc(galleryAlbumsTable.createdAt));

    // For each album get photo count
    const albumsWithCount = await Promise.all(
      albums.map(async (album) => {
        const photos = await db
          .select()
          .from(galleryPhotosTable)
          .where(eq(galleryPhotosTable.albumId, album.id))
          .orderBy(asc(galleryPhotosTable.sortOrder), asc(galleryPhotosTable.createdAt));
        return { ...album, photos };
      })
    );
    res.json(albumsWithCount);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

// POST /api/gallery/upload-url — get presigned URL for uploading a gallery photo
router.post(
  "/upload-url",
  requireAuth,
  requireRole("super_admin", "editor"),
  async (req, res) => {
    const { contentType, size } = req.body ?? {};
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
      res.status(400).json({ error: "Only image files are allowed (JPEG, PNG, WebP, GIF)" });
      return;
    }
    if (typeof size !== "number" || size <= 0 || size > MAX_PHOTO_SIZE) {
      res.status(400).json({ error: "File size must be between 1 byte and 20 MB" });
      return;
    }
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err) {
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  }
);

// POST /api/gallery/albums — create album
router.post("/albums", requireAuth, requireRole("super_admin", "editor"), async (req, res) => {
  const { title, description, coverUrl, sortOrder, published } = req.body ?? {};
  if (!title?.trim()) { res.status(400).json({ error: "Title is required" }); return; }
  try {
    const [album] = await db
      .insert(galleryAlbumsTable)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        coverUrl: coverUrl || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        published: published !== false,
        createdBy: (req as any).admin?.id ?? null,
      })
      .returning();
    res.json(album);
  } catch (err) {
    res.status(500).json({ error: "Failed to create album" });
  }
});

// PATCH /api/gallery/albums/:id — update album
router.patch("/albums/:id", requireAuth, requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, description, coverUrl, sortOrder, published } = req.body ?? {};
  try {
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (coverUrl !== undefined) updates.coverUrl = coverUrl || null;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
    if (published !== undefined) updates.published = Boolean(published);

    const [album] = await db
      .update(galleryAlbumsTable)
      .set(updates)
      .where(eq(galleryAlbumsTable.id, id))
      .returning();
    if (!album) { res.status(404).json({ error: "Album not found" }); return; }
    res.json(album);
  } catch (err) {
    res.status(500).json({ error: "Failed to update album" });
  }
});

// DELETE /api/gallery/albums/:id — delete album and all its photos
router.delete("/albums/:id", requireAuth, requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(galleryPhotosTable).where(eq(galleryPhotosTable.albumId, id));
    await db.delete(galleryAlbumsTable).where(eq(galleryAlbumsTable.id, id));
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete album" });
  }
});

// POST /api/gallery/photos — add photo to album
router.post("/photos", requireAuth, requireRole("super_admin", "editor"), async (req, res) => {
  const { albumId, url, caption, sortOrder } = req.body ?? {};
  if (!albumId || !url) { res.status(400).json({ error: "albumId and url are required" }); return; }
  try {
    const [photo] = await db
      .insert(galleryPhotosTable)
      .values({
        albumId: Number(albumId),
        url,
        caption: caption?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      })
      .returning();
    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: "Failed to add photo" });
  }
});

// PATCH /api/gallery/photos/:id — update photo caption / sortOrder
router.patch("/photos/:id", requireAuth, requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { caption, sortOrder } = req.body ?? {};
  try {
    const updates: Record<string, unknown> = {};
    if (caption !== undefined) updates.caption = caption?.trim() || null;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);

    const [photo] = await db
      .update(galleryPhotosTable)
      .set(updates)
      .where(eq(galleryPhotosTable.id, id))
      .returning();
    if (!photo) { res.status(404).json({ error: "Photo not found" }); return; }
    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: "Failed to update photo" });
  }
});

// DELETE /api/gallery/photos/:id — delete a single photo
router.delete("/photos/:id", requireAuth, requireRole("super_admin", "editor"), async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(galleryPhotosTable).where(eq(galleryPhotosTable.id, id));
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

export default router;
