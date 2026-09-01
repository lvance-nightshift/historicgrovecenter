/*
 * Idempotent: add Grove Center businesses + their owner(s), without clobbering
 * any existing curated company data.
 *
 * New companies are created UNPUBLISHED (drafts) so the public directory stays
 * clean until each owner fills in their listing. Existing companies (matched by
 * slug) are left as-is; only missing owner links are added.
 *
 *   export default async function seed(sql)
 * Run with a neon() client bound to the target branch (dev or prod).
 */
const KIND_MERCHANT = 1;
const ROLE_MERCHANT = 3;

// slug, name, category, website, owners[{first,last,email}]. `existing: true`
// means match an existing company by slug and only add owners.
const BUSINESSES = [
  {
    slug: "serenity-at-the-grove",
    name: "Serenity at the Grove",
    category: "Health & Beauty",
    website: "https://serenityinthegrove.com",
    owners: [{ first: "Amanda", last: null, email: "amanda@serenityinthegrove.com" }],
  },
  {
    slug: "historic-grove-theater",
    name: "The Historic Grove Theater",
    category: "Arts & Culture",
    website: null,
    owners: [
      { first: "Daniel", last: "Mantooth", email: "dmantooth1249@comcast.net" },
      { first: "David", last: "Allred", email: "davidallredonline@gmail.com" },
      { first: "Tim", last: "Fischer", email: "tfisc64760@aol.com" },
      { first: "Alyssa", last: null, email: "historicgrovetheater@gmail.com" },
    ],
  },
  {
    slug: "willow-floral", // existing "Oak Ridge Floral"
    name: "Oak Ridge Floral",
    existing: true,
    owners: [{ first: "Brandon", last: "Salamacha", email: "orfcllc@outlook.com" }],
  },
  {
    slug: "ascension-wellness",
    name: "Ascension Wellness",
    category: "Health & Beauty",
    website: null,
    owners: [{ first: "Trish", last: "Crowley", email: "trish2273@gmail.com" }],
  },
  {
    slug: "appalachian-frame-shop",
    name: "Appalachian Frame Shop",
    category: "Shopping",
    website: null,
    owners: [{ first: null, last: null, email: "appalachianframe@gmail.com" }],
  },
  {
    slug: "grove-barbershop", // existing "The Grove Barbershop"
    name: "The Grove Barbershop",
    existing: true,
    owners: [
      { first: "Laura", last: "Hackler", email: "laurahackler@outlook.com" },
      { first: "Jeff", last: "Hackler", email: "jeffhackler2@hotmail.com" },
    ],
  },
  {
    slug: "wolf-tattoo",
    name: "Wolf Tattoo",
    category: "Health & Beauty",
    website: null,
    owners: [{ first: null, last: null, email: "vaderman00@icloud.com" }],
  },
];

export default async function seed(sql) {
  let companiesCreated = 0;
  let peopleCreated = 0;
  let ownerLinks = 0;

  for (const b of BUSINESSES) {
    let [co] = await sql`SELECT id FROM companies WHERE slug = ${b.slug}`;
    if (!co) {
      [co] = await sql`
        INSERT INTO companies (slug, name, category, categories, website, published)
        VALUES (${b.slug}, ${b.name}, ${b.category}, ${JSON.stringify([b.category])}::jsonb, ${b.website ?? null}, false)
        RETURNING id`;
      companiesCreated++;
    }
    const companyId = co.id;

    // merchant kind
    const [ka] = await sql`SELECT 1 FROM company_kind_assignments WHERE company_id = ${companyId} AND kind_id = ${KIND_MERCHANT}`;
    if (!ka) {
      await sql`INSERT INTO company_kind_assignments (company_id, kind_id) VALUES (${companyId}, ${KIND_MERCHANT})`;
    }

    // owners
    for (const o of b.owners) {
      let [p] = await sql`SELECT id FROM people WHERE lower(email) = lower(${o.email})`;
      if (!p) {
        [p] = await sql`
          INSERT INTO people (first_name, last_name, email)
          VALUES (${o.first}, ${o.last}, ${o.email})
          RETURNING id`;
        peopleCreated++;
      }
      const personId = p.id;
      const [ra] = await sql`
        SELECT 1 FROM role_assignments
        WHERE person_id = ${personId} AND role_id = ${ROLE_MERCHANT} AND scope = 'company' AND scope_id = ${companyId}`;
      if (!ra) {
        await sql`
          INSERT INTO role_assignments (person_id, role_id, scope, scope_id)
          VALUES (${personId}, ${ROLE_MERCHANT}, 'company', ${companyId})`;
        ownerLinks++;
      }
    }
    console.log(`  ✓ ${b.name} (#${companyId}${b.existing ? ", existing" : ", new draft"}) — ${b.owners.length} owner(s)`);
  }
  console.log(`\nCompanies created: ${companiesCreated} | people created: ${peopleCreated} | owner links added: ${ownerLinks}`);
}
