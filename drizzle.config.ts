import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load the same env file Next.js uses locally.
config({ path: ".env.local" });

/*
 * Drizzle Kit config for migrations. Reads DATABASE_URL from .env.local.
 * Commands (see package.json):
 *   npm run db:generate  → create SQL migration from schema changes
 *   npm run db:migrate   → apply migrations to Neon
 *   npm run db:studio    → open Drizzle Studio
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Neon Auth manages this schema; keep drizzle-kit from touching it.
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
