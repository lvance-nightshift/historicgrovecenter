/*
 * Seeds (idempotent) the initial Grove Center merchant listings into the
 * `companies` table so the DB-backed directory has content. These are the
 * former placeholder merchants; admins/merchants edit or replace them in the
 * console. Each is published and tagged with the `merchant` kind.
 *
 *   npm run db:seed:merchants                 (uses .env.local → vercel-dev)
 *   DATABASE_URL=... node src/db/seed-merchants.mjs
 */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const merchants = [
  ["grove-theater", "The Grove Theater", "Arts & Culture", "A restored 1949 movie house and live venue", "The heart of the center since it first lit its marquee, the Grove Theater now hosts films, concerts, and community events under its original neon sign.", "(865) 555-0142", null, "Showtimes vary — see events"],
  ["corner-soda-fountain", "Corner Soda Fountain", "Dining", "Malts, floats, and a lunch counter that never left", "Spin a stool at the original counter for hand-dipped milkshakes, grilled sandwiches, and pie by the slice.", "(865) 555-0118", null, "Mon–Sat 8am–6pm"],
  ["grove-mercantile", "Grove Mercantile", "Shopping", "Gifts, goods, and Oak Ridge keepsakes", "A general store for the modern age — local crafts, home goods, and Secret City history you can take home.", "(865) 555-0173", null, "Tue–Sun 10am–6pm"],
  ["atomic-city-coffee", "Atomic City Coffee", "Dining", "Small-batch roasts & morning pastries", "Neighborhood coffee bar pouring espresso, pour-overs, and house-baked scones since sunrise.", null, null, "Daily 6:30am–3pm"],
  ["grove-barbershop", "Grove Barbershop", "Health & Beauty", "Classic cuts, hot-towel shaves", "Three chairs, straight razors, and conversation — the same trade that's served the center for generations.", "(865) 555-0166", null, "Tue–Sat 9am–5pm"],
  ["secret-city-books", "Secret City Books", "Shopping", "New, used & local-interest titles", "An independent bookshop with a deep Oak Ridge & Manhattan Project section and a reading nook in the back.", null, null, "Wed–Sun 11am–7pm"],
  ["grove-cleaners", "Grove Cleaners", "Services", "Dry cleaning & alterations", "Fast, careful garment care and tailoring, a fixture at the center for decades.", "(865) 555-0109", null, "Mon–Fri 7am–6pm, Sat 8am–2pm"],
  ["willow-floral", "Willow & Grove Floral", "Shopping", "Fresh arrangements & garden plants", "Seasonal bouquets, wedding florals, and porch plants from a family-run studio.", "(865) 555-0155", null, "Mon–Sat 9am–5pm"],
];

// Look up the `merchant` company_kind once.
const [kind] = await sql`SELECT id FROM company_kinds WHERE key = 'merchant'`;
if (!kind) {
  console.error("No 'merchant' company_kind — run the base seed first (npm run db:seed).");
  process.exit(1);
}

let n = 0;
for (const [slug, name, category, tagline, description, phone, website, hours] of merchants) {
  const [row] = await sql`
    INSERT INTO companies (slug, name, category, tagline, description, phone, website, hours, published)
    VALUES (${slug}, ${name}, ${category}, ${tagline}, ${description}, ${phone}, ${website}, ${hours}, true)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      tagline = EXCLUDED.tagline,
      description = EXCLUDED.description,
      phone = EXCLUDED.phone,
      hours = EXCLUDED.hours,
      published = true,
      updated_at = now()
    RETURNING id
  `;
  await sql`
    INSERT INTO company_kind_assignments (company_id, kind_id)
    VALUES (${row.id}, ${kind.id})
    ON CONFLICT DO NOTHING
  `;
  n++;
}

console.log(`✓ Seeded/updated ${n} merchants (published, tagged 'merchant').`);
