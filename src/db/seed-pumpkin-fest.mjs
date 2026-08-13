/*
 * Seeds (idempotent) the Fall Pumpkin Fest 2026 `events` row so vendor
 * registrations have something to attach to. Safe to re-run — it upserts by
 * slug and only fills columns, never deletes.
 *
 *   npm run db:seed:pumpkin                       (uses .env.local → vercel-dev)
 *   DATABASE_URL=... node src/db/seed-pumpkin-fest.mjs   (any environment)
 *
 * Keep the values here in sync with src/lib/pumpkin-fest.ts.
 */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const slug = "fall-pumpkin-fest-2026";
const title = "Fall Pumpkin Fest";
const startAt = "2026-10-17T14:00:00.000Z"; // 10 a.m. EDT
const endAt = "2026-10-17T20:00:00.000Z"; // 4 p.m. EDT
const location = "Historic Grove Center, Oak Ridge, TN";
const description =
  "Reserve your spot at the Oak Ridge Historic Grove Center Fall Pumpkin Fest! " +
  "This beloved community event brings together music, pumpkins, local vendors, " +
  "a petting zoo, and a pet costume contest for a day of fun for the whole family. " +
  "Benefits SARG Inc. (Shelter Animals Rescue Group), the Historic Grove Theater, and local arts.";

const [row] = await sql`
  INSERT INTO events
    (slug, title, type, start_at, end_at, location, description,
     published, vendor_apps_open, booth_fee_cents)
  VALUES
    (${slug}, ${title}, 'association', ${startAt}, ${endAt}, ${location},
     ${description}, true, true, 4500)
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    start_at = EXCLUDED.start_at,
    end_at = EXCLUDED.end_at,
    location = EXCLUDED.location,
    description = EXCLUDED.description,
    vendor_apps_open = true,
    booth_fee_cents = 4500,
    updated_at = now()
  RETURNING id, slug
`;

console.log(`✓ Pumpkin Fest event ready: #${row.id} (${row.slug})`);
