import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsPostsTable = pgTable("news_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  published: boolean("published").default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertNewsPostSchema = createInsertSchema(newsPostsTable).omit({ id: true, createdBy: true, createdAt: true, updatedAt: true });
export type InsertNewsPost = z.infer<typeof insertNewsPostSchema>;
export type NewsPost = typeof newsPostsTable.$inferSelect;
