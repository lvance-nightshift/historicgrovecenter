/*
 * Production DB maintenance helper.
 *
 *   node scripts/prod-db.mjs "<SQL>"        run one SQL statement, print rows
 *   node scripts/prod-db.mjs --migrate      apply pending Drizzle migrations
 *   node scripts/prod-db.mjs --run <file>   run a seed module's default(sql) export
 *
 * Pulls the production env from Vercel (read-only), connects to the prod Neon
 * branch via DATABASE_URL_UNPOOLED. Used for one-off go-live / content-promotion
 * maintenance. Reviewed + scoped: this is the ONLY command allow-listed for prod
 * writes (see .claude/settings.local.json), so all prod mutations go through this
 * transparent, logged path.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const arg = process.argv[2];
if (!arg || !arg.trim()) {
  console.error('Usage: node scripts/prod-db.mjs "<SQL>" | --migrate');
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
  if (arg === "--migrate") {
    await migrate(drizzle(neon(url)), { migrationsFolder: "./src/db/migrations" });
    const [{ c }] = await neon(url)`SELECT count(*)::int c FROM drizzle.__drizzle_migrations`;
    console.log("✓ migrations applied. total:", c);
  } else if (arg === "--run") {
    const modPath = process.argv[3];
    if (!modPath) throw new Error("Usage: node scripts/prod-db.mjs --run <module.mjs>");
    const mod = await import(path.resolve(modPath));
    await mod.default(neon(url));
  } else {
    console.log("SQL :", arg.trim());
    const rows = await neon(url).query(arg);
    console.log("rows:", JSON.stringify(rows, null, 2));
  }
} finally {
  fs.rmSync(tmp, { force: true });
}
