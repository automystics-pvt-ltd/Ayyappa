import {
  pgTable, serial, varchar, text,
  timestamp, boolean, integer,
} from "drizzle-orm/pg-core";

export const inKindContributionsTable = pgTable("in_kind_contributions", {
  id:            serial("id").primaryKey(),
  receiptToken:  text("receipt_token").unique(),
  donorName:     varchar("donor_name",  { length: 200 }).notNull(),
  place:         varchar("place",       { length: 200 }),
  description:   text("description").notNull(),
  contributedAt: timestamp("contributed_at", { withTimezone: true }).defaultNow(),
  createdBy:     integer("created_by"),
  createdAt:     timestamp("created_at",  { withTimezone: true }).defaultNow(),
  isActive:      boolean("is_active").default(true),
});
