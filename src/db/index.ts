/*
 * Drizzle client over Neon's serverless HTTP driver.
 *
 * IMPORTANT: initialized lazily. `DATABASE_URL` is not present during the
 * production build (secrets aren't set at build time), so we must never read
 * it or connect at module load — only when a query actually runs. Import this
 * as `import { getDb } from "@/db"` and call `getDb()` inside server code.
 */

import "server-only";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export { schema };

type DB = NeonHttpDatabase<typeof schema>;

let _db: DB | null = null;

export function getDb(): DB {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to " +
        ".env.local (local) and the Vercel project env (production).",
    );
  }

  _db = drizzle(neon(url), { schema });
  return _db;
}

/** True when the database is configured — use to gate DB-backed features. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
