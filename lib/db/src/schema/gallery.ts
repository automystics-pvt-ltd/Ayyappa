import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const galleryAlbumsTable = pgTable("gallery_albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  sortOrder: integer("sort_order").default(0),
  published: boolean("published").default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const galleryPhotosTable = pgTable("gallery_photos", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id"),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertAlbumSchema = createInsertSchema(galleryAlbumsTable).omit({ id: true, createdBy: true, createdAt: true });
export const insertPhotoSchema = createInsertSchema(galleryPhotosTable).omit({ id: true, createdAt: true });
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type GalleryAlbum = typeof galleryAlbumsTable.$inferSelect;
export type GalleryPhoto = typeof galleryPhotosTable.$inferSelect;
