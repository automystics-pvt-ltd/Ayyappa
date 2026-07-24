import { pgTable, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type SiteSetting = typeof siteSettingsTable.$inferSelect;
