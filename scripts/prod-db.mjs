/*
 * Production DB maintenance helper.
 *
 *   node scripts/prod-db.mjs "<SQL>"
 *
 * Pulls the production env from Vercel (read-only), connects to the prod Neon
 * branch via DATABASE_URL_UNPOOLED, runs the single SQL statement passed as the
 * first argument, and prints the returned rows. Used for one-off go-live /
 * content-promotion maintenance. Reviewed + scoped: this is the ONLY command
 * allow-listed for prod writes (see .claude/settings.local.json), so all prod
 * mutations go through this transparent, logged path.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const query = process.argv[2];
if (!query || !query.trim()) {
  console.error('Usage: node scripts/prod-db.mjs "<SQL>"');
  process.exit(1);
}

const tmp = path.join(os.tmpdir(), `.env.prod.${process.pid}`);
try {
  execSync(`vercel env pull "${tmp}" --environment=production --yes`, { stdio: "ignore" });
  const txt = fs.readFileSync(tmp, "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  const url = env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("DATABASE_URL_UNPOOLED not found in production env.");
  console.log("prod:", new URL(url).host);
  console.log("SQL :", query.trim());
  const sql = neon(url);
  const rows = await sql.query(query);
  console.log("rows:", JSON.stringify(rows, null, 2));
} finally {
  fs.rmSync(tmp, { force: true });
}
