import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  // YYYY-MM-DD day bucket used for "today" stats and per-session daily dedup
  dayKey: varchar("day_key", { length: 10 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Visit = typeof visitsTable.$inferSelect;
