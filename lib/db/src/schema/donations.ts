import { pgTable, serial, varchar, text, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const donationsTable = pgTable("donations", {
  id: serial("id").primaryKey(),
  receiptToken: text("receipt_token"),
  donorName: varchar("donor_name", { length: 200 }).notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  place: varchar("place", { length: 200 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  transactionId: varchar("transaction_id", { length: 200 }).notNull(),
  screenshotUrl: text("screenshot_url"),
  anonymous: boolean("anonymous").default(false),
  message: text("message"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertDonationSchema = createInsertSchema(donationsTable).omit({
  id: true, status: true, rejectionReason: true, reviewedBy: true, reviewedAt: true, createdAt: true
});
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donationsTable.$inferSelect;
