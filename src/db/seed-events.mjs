/*
 * Seeds (idempotent) the starter association events so the public calendar is
 * populated and everything is DB-driven / editable in the admin. Times are
 * Eastern (stored with an EDT offset — fine for these demo rows; the admin can
 * adjust). Merchants' business events also appear on the calendar automatically.
 *
 *   npm run db:seed:events
 */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// slug, title, date, start(24h), end(24h|null), location, description
const rows = [
  ["summer-night-market", "Summer Night Market", "2026-07-18", "17:00", "21:00", "Grove Center Courtyard", "Dozens of Oak Ridge makers and growers fill the courtyard for an evening market. Grab dinner from rotating food trucks, shop handmade goods, and stay for the band."],
  ["grove-theater-classics-rear-window", "Grove Theater Classics: Rear Window", "2026-07-25", "19:30", null, "The Grove Theater", "Our summer classic-film series continues with Alfred Hitchcock's Rear Window, projected in the historic Grove Theater. Concessions from the original snack bar."],
  ["first-friday-live", "First Friday Live", "2026-08-07", "18:00", "21:00", "Grove Center Courtyard", "Merchants stay open late and live bands take the courtyard stage the first Friday of every month. Free and family-friendly."],
  ["secret-city-history-walk", "Secret City History Walk", "2026-08-16", "10:00", "11:30", "Meet at the Grove Theater marquee", "Walk the center with a local historian and hear how Grove Center served the workers of the wartime Secret City. Free; donations support preservation."],
  ["grove-harvest-festival", "Grove Harvest Festival", "2026-10-10", "11:00", "17:00", "Throughout Grove Center", "Our biggest day of the year: a fall market, hayrides, a merchant chili cook-off, live bluegrass, and pumpkins for the little ones."],
  ["holiday-tree-lighting", "Holiday Tree Lighting", "2026-11-27", "18:00", null, "Grove Center Courtyard", "Join us the evening after Thanksgiving as we light the courtyard tree, sing carols, and welcome the holiday season to Grove Center."],
];

let n = 0;
for (const [slug, title, date, start, end, location, description] of rows) {
  const startAt = `${date}T${start}:00-04:00`;
  const endAt = end ? `${date}T${end}:00-04:00` : null;
  await sql`
    INSERT INTO events (slug, title, type, start_at, end_at, location, description, published)
    VALUES (${slug}, ${title}, 'association', ${startAt}, ${endAt}, ${location}, ${description}, true)
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      start_at = EXCLUDED.start_at,
      end_at = EXCLUDED.end_at,
      location = EXCLUDED.location,
      description = EXCLUDED.description,
      published = true,
      updated_at = now()
  `;
  n++;
}
console.log(`✓ seeded/updated ${n} association events`);
