import { pgTable, serial, text, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  eventType: varchar("event_type", { length: 50 }),
  description: text("description"),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  location: text("location"),
  posterUrl: text("poster_url"),
  published: boolean("published").default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdBy: true, createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
