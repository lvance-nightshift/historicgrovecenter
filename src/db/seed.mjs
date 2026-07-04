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

// Default theme (mirrors globals.css / THEME_TOKENS defaults).
const defaultPalette = {
  grove: "#2f4a3c",
  groveDark: "#22382d",
  groveLight: "#7a9b86",
  brick: "#a8482f",
  brickDark: "#8a3a25",
  brass: "#c08a2d",
  brassLight: "#e0b968",
  background: "#f7f3ea",
  surface: "#fffdf8",
  border: "#e4dcc9",
  foreground: "#24211b",
  muted: "#6b6558",
};
await sql`INSERT INTO themes (name, slug, palette, is_default)
          VALUES (${"Default"}, ${"default"}, ${JSON.stringify(defaultPalette)}, ${true})
          ON CONFLICT (slug) DO NOTHING`;

const [r] = await sql`SELECT count(*)::int AS n FROM roles`;
const [k] = await sql`SELECT count(*)::int AS n FROM company_kinds`;
const [th] = await sql`SELECT count(*)::int AS n FROM themes`;
console.log(`seeded — roles: ${r.n}, company_kinds: ${k.n}, themes: ${th.n}`);
