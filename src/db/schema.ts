/*
 * Grove Center data model (Drizzle → Neon Postgres).
 *
 * Core idea: two master lists — PEOPLE and COMPANIES — joined many-to-many,
 * with a flexible ROLE layer on top. Everything else (merchants, events,
 * vendors, bands, friends) hangs off those.
 *
 *   person ──< company_membership >── company
 *     │
 *     ├──< role_assignment >──  role  (scoped to global | company | event)
 *     └── user_id ──→ neon_auth.user  (Better Auth login; nullable)
 *
 * Authentication (who you are) lives in Neon Auth's `neon_auth` schema.
 * Identity + authorization (roles, affiliations) live here in `public`.
 *
 * Run `npm run db:generate` after edits, then `npm run db:migrate`.
 */

import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ *
 * Enums — fixed sets (not editable at runtime).
 * ------------------------------------------------------------------ */
export const eventTypeEnum = pgEnum("event_type", ["association", "business"]);
export const participationTypeEnum = pgEnum("participation_type", [
  "vendor",
  "food_vendor",
  "band",
  "sponsor",
]);
export const participationStatusEnum = pgEnum("participation_status", [
  "pending",
  "approved",
  "waitlisted",
  "rejected",
  "cancelled",
]);
export const roleScopeEnum = pgEnum("role_scope", [
  "global",
  "company",
  "event",
]);

/* ------------------------------------------------------------------ *
 * Config / lookup tables — editable through the developer interface.
 * `is_system` marks built-ins that shouldn't be deleted.
 * ------------------------------------------------------------------ */
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companyKinds = pgTable("company_kinds", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
});

/* ------------------------------------------------------------------ *
 * People & Companies — the two master lists.
 * ------------------------------------------------------------------ */
export const people = pgTable(
  "people",
  {
    id: serial("id").primaryKey(),
    // → neon_auth.user.id (Better Auth). Nullable: we capture people
    // (volunteers, contacts) before they ever have a login. Soft reference
    // (no cross-schema FK) since Neon Auth manages that table.
    userId: text("user_id"),
    firstName: varchar("first_name", { length: 120 }),
    lastName: varchar("last_name", { length: 120 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 40 }),
    // "Friend of the Grove" marketing consent.
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("people_email_idx").on(t.email),
    index("people_user_idx").on(t.userId),
  ],
);

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 140 }).unique(),
  name: varchar("name", { length: 200 }).notNull(),
  tagline: text("tagline"),
  description: text("description"),
  hours: text("hours"),
  website: text("website"),
  phone: varchar("phone", { length: 40 }),
  addressLine: text("address_line"),
  logoKey: text("logo_key"), // R2 object key
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A company can be several kinds at once (merchant + vendor + band…). */
export const companyKindAssignments = pgTable(
  "company_kind_assignments",
  {
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    kindId: integer("kind_id")
      .notNull()
      .references(() => companyKinds.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.kindId] })],
);

/** Which people belong to which companies, and in what capacity. */
export const companyMemberships = pgTable(
  "company_memberships",
  {
    id: serial("id").primaryKey(),
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }), // Owner, Manager, Contact, Member…
    isPrimaryContact: boolean("is_primary_contact").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("company_membership_uq").on(t.personId, t.companyId)],
);

/* ------------------------------------------------------------------ *
 * Roles — a person can hold many, each optionally scoped to a company
 * or an event. `scope_id` points at companies.id or events.id depending
 * on `scope` (app-enforced; polymorphic, so no FK).
 * ------------------------------------------------------------------ */
export const roleAssignments = pgTable(
  "role_assignments",
  {
    id: serial("id").primaryKey(),
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    scope: roleScopeEnum("scope").notNull().default("global"),
    scopeId: integer("scope_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("role_assignments_person_idx").on(t.personId),
    index("role_assignments_scope_idx").on(t.scope, t.scopeId),
  ],
);

/* ------------------------------------------------------------------ *
 * Events.
 * ------------------------------------------------------------------ */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  type: eventTypeEnum("type").notNull().default("association"),
  // Set when this is a single business's own event.
  ownerCompanyId: integer("owner_company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  location: text("location"),
  description: text("description"),
  heroImageKey: text("hero_image_key"),
  published: boolean("published").notNull().default(false),
  // Application intake toggles.
  vendorAppsOpen: boolean("vendor_apps_open").notNull().default(false),
  foodAppsOpen: boolean("food_apps_open").notNull().default(false),
  bandAppsOpen: boolean("band_apps_open").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Applications to take part in an event, and the approved participants. */
export const eventParticipations = pgTable(
  "event_participations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    // Either/both may be set — a company applies, or a solo person applies.
    companyId: integer("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    personId: integer("person_id").references(() => people.id, {
      onDelete: "set null",
    }),
    type: participationTypeEnum("type").notNull(),
    status: participationStatusEnum("status").notNull().default("pending"),
    boothNumber: varchar("booth_number", { length: 40 }),
    // Food vendors: permit + insurance docs (R2 keys) and verification.
    permitDocKey: text("permit_doc_key"),
    insuranceDocKey: text("insurance_doc_key"),
    permitVerified: boolean("permit_verified").notNull().default(false),
    insuranceVerified: boolean("insurance_verified").notNull().default(false),
    // Reserved for whenever fee collection is decided — nothing built yet.
    feeAmountCents: integer("fee_amount_cents"),
    paymentStatus: varchar("payment_status", { length: 32 }),
    // Type-specific extra fields (band links, vendor product list, etc.).
    applicationData: jsonb("application_data"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("event_participations_event_idx").on(t.eventId),
    index("event_participations_status_idx").on(t.status),
  ],
);

export const eventScheduleItems = pgTable("event_schedule_items", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  title: varchar("title", { length: 200 }).notNull(),
  location: text("location"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const eventShifts = pgTable("event_shifts", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  role: varchar("role", { length: 120 }),
  neededCount: integer("needed_count").notNull().default(1),
});

export const eventShiftAssignments = pgTable(
  "event_shift_assignments",
  {
    id: serial("id").primaryKey(),
    shiftId: integer("shift_id")
      .notNull()
      .references(() => eventShifts.id, { onDelete: "cascade" }),
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("event_shift_assignment_uq").on(t.shiftId, t.personId)],
);

export const eventContacts = pgTable("event_contacts", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  personId: integer("person_id").references(() => people.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 200 }), // fallback if no person record
  role: varchar("role", { length: 120 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Freeform info blocks: map, parking, setup instructions, etc. */
export const eventInfoSections = pgTable("event_info_sections", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 64 }).notNull(), // map | parking | setup | …
  title: varchar("title", { length: 200 }),
  body: text("body"),
  imageKey: text("image_key"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ------------------------------------------------------------------ *
 * Contact form inbox (existing). Optionally matched to a person later.
 * ------------------------------------------------------------------ */
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => people.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 300 }),
  message: text("message").notNull(),
  emailStatus: varchar("email_status", { length: 16 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * Inferred types for app code.
 * ------------------------------------------------------------------ */
export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type RoleAssignment = typeof roleAssignments.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventParticipation = typeof eventParticipations.$inferSelect;
export type NewEventParticipation = typeof eventParticipations.$inferInsert;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
