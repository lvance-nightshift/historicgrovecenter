/*
 * Apply scripts/sponsors-data.json to the Pumpkin Fest + Harvest Table events.
 *
 *   dev :  node --env-file=.env.local scripts/apply-sponsors.mjs
 *   prod:  node scripts/prod-db.mjs --run scripts/apply-sponsors.mjs
 *
 * Idempotent — re-running just re-sets the same sponsors jsonb.
 */
import fs from "node:fs";
import path from "node:path";

const SLUGS = ["fall-pumpkin-fest-2026", "oak-ridge-harvest-table-2026"];

export default async function apply(sql) {
  const data = JSON.parse(
    fs.readFileSync(path.resolve("scripts/sponsors-data.json"), "utf8"),
  );
  const rows = await sql.query(
    "UPDATE events SET sponsors = $1::jsonb, updated_at = now() WHERE slug = ANY($2) RETURNING slug",
    [JSON.stringify(data), SLUGS],
  );
  console.log(`✓ set ${data.length} sponsors on:`, rows.map((r) => r.slug).join(", "));
}

// Allow running directly against dev (DATABASE_URL from --env-file).
if (import.meta.url === `file://${process.argv[1]}`) {
  const { neon } = await import("@neondatabase/serverless");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set (run with --env-file=.env.local)");
  await apply(neon(url));
}
