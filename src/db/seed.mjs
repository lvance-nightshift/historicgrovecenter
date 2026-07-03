/*
 * Seeds the editable lookup tables (roles, company_kinds) with their initial
 * system values. Idempotent — safe to re-run. These are editable later through
 * the developer interface; `is_system` marks built-ins.
 *
 *   npm run db:seed            (uses .env.local → vercel-dev)
 *   DATABASE_URL=... node src/db/seed.mjs   (any environment)
 */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const roles = [
  ["developer", "Developer", "Full access to everything.", true],
  ["association_admin", "Association Admin", "Site content, association events, forms inbox, all events.", true],
  ["merchant", "Merchant", "Manages their own business listing and events.", true],
  ["event_coordinator", "Event Coordinator", "Inputs and manages data for a specific event.", true],
  ["event_volunteer", "Event Volunteer", "Reads a specific event's operational info.", true],
  ["friend", "Friend of the Grove", "End-user subscriber; access to gated perks.", true],
];

const kinds = [
  ["merchant", "Merchant", "A permanent Grove Center business.", true],
  ["food_vendor", "Food Vendor / Truck", "Food seller (permit + insurance required).", true],
  ["vendor", "Vendor", "Booth vendor at an event.", true],
  ["band", "Band / Performer", "Musical act or performer.", true],
  ["sponsor", "Sponsor", "Event or association sponsor.", true],
  ["other", "Other", "Any other organization.", true],
];

for (const [key, label, description, isSystem] of roles) {
  await sql`INSERT INTO roles (key, label, description, is_system)
            VALUES (${key}, ${label}, ${description}, ${isSystem})
            ON CONFLICT (key) DO NOTHING`;
}
for (const [key, label, description, isSystem] of kinds) {
  await sql`INSERT INTO company_kinds (key, label, description, is_system)
            VALUES (${key}, ${label}, ${description}, ${isSystem})
            ON CONFLICT (key) DO NOTHING`;
}

const [r] = await sql`SELECT count(*)::int AS n FROM roles`;
const [k] = await sql`SELECT count(*)::int AS n FROM company_kinds`;
console.log(`seeded — roles: ${r.n}, company_kinds: ${k.n}`);
