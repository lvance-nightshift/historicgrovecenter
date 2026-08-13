/*
 * Seeds (idempotent) the default merchant directory categories.
 *   npm run db:seed:categories       (uses .env.local)
 */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const defaults = [
  "Dining",
  "Shopping",
  "Services",
  "Health & Beauty",
  "Arts & Culture",
];

let n = 0;
for (let i = 0; i < defaults.length; i++) {
  await sql`INSERT INTO merchant_categories (name, sort_order)
            VALUES (${defaults[i]}, ${i})
            ON CONFLICT (name) DO NOTHING`;
  n++;
}
console.log(`✓ ensured ${n} default categories`);
