/*
 * Database schema (Drizzle ORM → Neon Postgres).
 *
 * Note on auth: Neon Auth (Stack Auth) manages users in a separate,
 * Neon-managed schema (`neon_auth.users_sync`). We do NOT define a users
 * table here — reference user IDs (text) from that synced table when needed.
 *
 * Run `npm run db:generate` after editing, then `npm run db:migrate`.
 */

import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  date,
  index,
} from "drizzle-orm/pg-core";

/** Merchant directory. Mirrors the shape currently in src/lib/merchants.ts. */
export const merchants = pgTable(
  "merchants",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    tagline: text("tagline"),
    description: text("description"),
    phone: varchar("phone", { length: 32 }),
    website: text("website"),
    hours: text("hours"),
    // R2 object key for the merchant's logo/photo (see src/lib/r2.ts).
    imageKey: text("image_key"),
    published: boolean("published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("merchants_category_idx").on(t.category)],
);

/** Events / calendar. Mirrors the shape in src/lib/events.ts. */
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    date: date("date").notNull(),
    startTime: varchar("start_time", { length: 32 }),
    endTime: varchar("end_time", { length: 32 }),
    location: text("location"),
    category: varchar("category", { length: 64 }).notNull(),
    summary: text("summary"),
    description: text("description"),
    imageKey: text("image_key"),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("events_date_idx").on(t.date)],
);

/** Contact-form submissions, stored before/after emailing the association. */
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 300 }),
  message: text("message").notNull(),
  // "pending" until the notification email is sent, then "sent" or "failed".
  emailStatus: varchar("email_status", { length: 16 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;
export type EventRow = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
