"use server";

/*
 * Admin console mutations. Every action is gated to admins (developer /
 * association_admin) via assertAdmin(). Typed args, called from client
 * components; each revalidates the affected path.
 */

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { isEmailConfigured, sendMerchantInvite } from "@/lib/email";
import {
  people,
  companies,
  companyKindAssignments,
  companyMemberships,
  roleAssignments,
  roles,
  mediaAttachments,
  merchantCategories,
  events,
} from "@/db/schema";
import { normalizeCategories } from "@/lib/merchants";
import { getActor, isAdmin, type RoleScope } from "@/lib/auth/authorize";
import {
  setSiteMedia,
  updateMediaMeta as _updateMediaMeta,
  addMediaTag as _addMediaTag,
  removeMediaTag as _removeMediaTag,
  type MediaTagRef,
} from "@/lib/media";

async function assertAdmin() {
  const actor = await getActor();
  if (!actor || !isAdmin(actor)) throw new Error("Forbidden");
  return actor;
}

/* ---------------- Site appearance ---------------- */

/** Set (or clear, with null) the home-page hero image. */
export async function setHomeHero(mediaId: number | null): Promise<void> {
  await assertAdmin();
  await setSiteMedia("home_hero", mediaId);
  revalidatePath("/");
  revalidatePath("/admin/site");
}

/* ---------------- Media metadata & tags ---------------- */

export async function updateMediaMeta(
  mediaId: number,
  input: { title?: string | null; altText?: string | null; credit?: string | null },
): Promise<void> {
  await assertAdmin();
  await _updateMediaMeta(mediaId, input);
  revalidatePath("/admin/media");
  revalidatePath("/");
}

export async function addMediaTag(
  mediaId: number,
  name: string,
): Promise<MediaTagRef | null> {
  await assertAdmin();
  const tag = await _addMediaTag(mediaId, name);
  revalidatePath("/admin/media");
  return tag;
}

export async function removeMediaTag(
  mediaId: number,
  tagId: number,
): Promise<void> {
  await assertAdmin();
  await _removeMediaTag(mediaId, tagId);
  revalidatePath("/admin/media");
}

const clean = (v?: string | null) => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

/* ---------------- People ---------------- */

export async function createPerson(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  marketingOptIn?: boolean;
}): Promise<number> {
  await assertAdmin();
  const [row] = await getDb()
    .insert(people)
    .values({
      firstName: clean(input.firstName),
      lastName: clean(input.lastName),
      email: clean(input.email),
      phone: clean(input.phone),
      marketingOptIn: Boolean(input.marketingOptIn),
    })
    .returning({ id: people.id });
  revalidatePath("/admin/people");
  return row.id;
}

export async function updatePerson(
  id: number,
  input: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    marketingOptIn?: boolean;
  },
): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(people)
    .set({
      firstName: clean(input.firstName),
      lastName: clean(input.lastName),
      email: clean(input.email),
      phone: clean(input.phone),
      marketingOptIn: Boolean(input.marketingOptIn),
      updatedAt: new Date(),
    })
    .where(eq(people.id, id));
  revalidatePath(`/admin/people/${id}`);
  revalidatePath("/admin/people");
}

/* ---------------- Role assignments ---------------- */

export async function addRoleAssignment(input: {
  personId: number;
  roleId: number;
  scope: RoleScope;
  scopeId?: number | null;
}): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const scopeId = input.scope === "global" ? null : (input.scopeId ?? null);

  // Avoid duplicates (no DB unique constraint on this combo).
  const existing = await db
    .select({ id: roleAssignments.id })
    .from(roleAssignments)
    .where(
      and(
        eq(roleAssignments.personId, input.personId),
        eq(roleAssignments.roleId, input.roleId),
        eq(roleAssignments.scope, input.scope),
        scopeId === null
          ? undefined
          : eq(roleAssignments.scopeId, scopeId),
      ),
    );
  if (existing.length === 0) {
    await db.insert(roleAssignments).values({
      personId: input.personId,
      roleId: input.roleId,
      scope: input.scope,
      scopeId,
    });
  }
  revalidatePath(`/admin/people/${input.personId}`);
}

export async function removeRoleAssignment(
  assignmentId: number,
  personId: number,
): Promise<void> {
  await assertAdmin();
  await getDb().delete(roleAssignments).where(eq(roleAssignments.id, assignmentId));
  revalidatePath(`/admin/people/${personId}`);
}

/* ---------------- Company memberships ---------------- */

export async function addMembership(input: {
  personId: number;
  companyId: number;
  title?: string;
  isPrimaryContact?: boolean;
}): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const existing = await db
    .select({ id: companyMemberships.id })
    .from(companyMemberships)
    .where(
      and(
        eq(companyMemberships.personId, input.personId),
        eq(companyMemberships.companyId, input.companyId),
      ),
    );
  if (existing.length === 0) {
    await db.insert(companyMemberships).values({
      personId: input.personId,
      companyId: input.companyId,
      title: clean(input.title),
      isPrimaryContact: Boolean(input.isPrimaryContact),
    });
  }
  revalidatePath(`/admin/people/${input.personId}`);
}

export async function removeMembership(
  membershipId: number,
  personId: number,
): Promise<void> {
  await assertAdmin();
  await getDb().delete(companyMemberships).where(eq(companyMemberships.id, membershipId));
  revalidatePath(`/admin/people/${personId}`);
}

/* ---------------- Companies ---------------- */

function slugifyName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** A slug unique across companies (base from provided slug or the name). */
async function uniqueCompanySlug(name: string, provided?: string | null): Promise<string> {
  const db = getDb();
  const base = slugifyName(provided?.trim() || name) || "business";
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [hit] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, slug));
    if (!hit) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function createCompany(input: {
  name: string;
  slug?: string;
  tagline?: string;
  kindIds?: number[];
}): Promise<number> {
  await assertAdmin();
  const db = getDb();
  const [row] = await db
    .insert(companies)
    .values({
      name: input.name.trim(),
      slug: await uniqueCompanySlug(input.name, input.slug),
      tagline: clean(input.tagline),
    })
    .returning({ id: companies.id });
  if (input.kindIds?.length) {
    await db
      .insert(companyKindAssignments)
      .values(input.kindIds.map((kindId) => ({ companyId: row.id, kindId })));
  }
  revalidatePath("/admin/companies");
  return row.id;
}

export async function setCompanyKinds(
  companyId: number,
  kindIds: number[],
): Promise<void> {
  await assertAdmin();
  const db = getDb();
  await db
    .delete(companyKindAssignments)
    .where(eq(companyKindAssignments.companyId, companyId));
  if (kindIds.length) {
    await db
      .insert(companyKindAssignments)
      .values(kindIds.map((kindId) => ({ companyId, kindId })));
  }
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/companies");
}

export async function setCompanyPublished(
  companyId: number,
  published: boolean,
): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(companies)
    .set({ published, updatedAt: new Date() })
    .where(eq(companies.id, companyId));
  revalidatePath("/admin/companies");
  revalidatePath("/merchants");
  revalidatePath("/");
}

export async function deleteCompany(companyId: number): Promise<void> {
  await assertAdmin();
  const db = getDb();
  // Clean up polymorphic references that have no FK cascade.
  await db
    .delete(mediaAttachments)
    .where(
      and(
        eq(mediaAttachments.targetType, "company"),
        eq(mediaAttachments.targetId, companyId),
      ),
    );
  await db
    .delete(roleAssignments)
    .where(
      and(eq(roleAssignments.scope, "company"), eq(roleAssignments.scopeId, companyId)),
    );
  // Remove this company's business events (schema would otherwise orphan them
  // as owner-null, leaving them published on the public calendar).
  await db.delete(events).where(eq(events.ownerCompanyId, companyId));
  // Company row: cascades kind assignments + memberships.
  await db.delete(companies).where(eq(companies.id, companyId));
  revalidatePath("/admin/companies");
  revalidatePath("/merchants");
  revalidatePath("/");
}

/* ---------------- Merchant categories (editable master list) ---------------- */

// Rewrite every company's categories array on rename (newName) or delete (null).
async function cascadeCategory(oldName: string, newName: string | null) {
  const db = getDb();
  const rows = await db
    .select({ id: companies.id, categories: companies.categories })
    .from(companies)
    .where(isNotNull(companies.categories));
  for (const row of rows) {
    const cats = normalizeCategories(row.categories);
    if (!cats.includes(oldName)) continue;
    let next = cats.filter((c) => c !== oldName);
    if (newName && !next.includes(newName)) next = [...next, newName];
    await db
      .update(companies)
      .set({ categories: next, updatedAt: new Date() })
      .where(eq(companies.id, row.id));
  }
}

function revalidateCategoryConsumers() {
  revalidatePath("/admin/categories");
  revalidatePath("/merchants");
  revalidatePath("/");
}

export async function addMerchantCategory(name: string): Promise<void> {
  await assertAdmin();
  const clean = name.trim();
  if (!clean) throw new Error("Category name is required.");
  const db = getDb();
  const existing = await db.select({ id: merchantCategories.id }).from(merchantCategories);
  await db
    .insert(merchantCategories)
    .values({ name: clean, sortOrder: existing.length })
    .onConflictDoNothing();
  revalidateCategoryConsumers();
}

export async function renameMerchantCategory(id: number, name: string): Promise<void> {
  await assertAdmin();
  const clean = name.trim();
  if (!clean) throw new Error("Category name is required.");
  const db = getDb();
  const [row] = await db
    .select({ name: merchantCategories.name })
    .from(merchantCategories)
    .where(eq(merchantCategories.id, id));
  if (!row || row.name === clean) return;
  await db.update(merchantCategories).set({ name: clean }).where(eq(merchantCategories.id, id));
  await cascadeCategory(row.name, clean);
  revalidateCategoryConsumers();
}

export async function deleteMerchantCategory(id: number): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const [row] = await db
    .select({ name: merchantCategories.name })
    .from(merchantCategories)
    .where(eq(merchantCategories.id, id));
  if (!row) return;
  await db.delete(merchantCategories).where(eq(merchantCategories.id, id));
  await cascadeCategory(row.name, null);
  revalidateCategoryConsumers();
}

/* ---------------- Company owners (merchant role assignment) ---------------- */

async function merchantRoleId(): Promise<number | null> {
  const [r] = await getDb().select({ id: roles.id }).from(roles).where(eq(roles.key, "merchant"));
  return r?.id ?? null;
}

/** Assign a person (found or created by email) as an owner/manager of a company. */
export async function addCompanyOwnerByEmail(
  companyId: number,
  email: string,
  name?: string,
): Promise<number> {
  await assertAdmin();
  const em = email.trim();
  if (!em) throw new Error("Email is required.");
  const db = getDb();

  let [person] = await db
    .select({ id: people.id })
    .from(people)
    .where(sql`lower(${people.email}) = lower(${em})`);
  if (!person) {
    const n = (name ?? "").trim();
    const i = n.indexOf(" ");
    const firstName = n ? (i === -1 ? n : n.slice(0, i)) : null;
    const lastName = n && i !== -1 ? n.slice(i + 1) : null;
    [person] = await db
      .insert(people)
      .values({ email: em, firstName, lastName })
      .returning({ id: people.id });
  }

  const roleId = await merchantRoleId();
  if (!roleId) throw new Error("Merchant role is missing.");

  const existing = await db
    .select({ id: roleAssignments.id })
    .from(roleAssignments)
    .where(
      and(
        eq(roleAssignments.personId, person.id),
        eq(roleAssignments.roleId, roleId),
        eq(roleAssignments.scope, "company"),
        eq(roleAssignments.scopeId, companyId),
      ),
    );
  if (existing.length === 0) {
    await db
      .insert(roleAssignments)
      .values({ personId: person.id, roleId, scope: "company", scopeId: companyId });
  }
  revalidatePath(`/admin/companies/${companyId}`);
  return person.id;
}

/** Email a company owner an invite to claim/manage their business listing. */
export async function sendOwnerInvite(
  companyId: number,
  personId: number,
): Promise<void> {
  await assertAdmin();
  if (!isEmailConfigured()) throw new Error("Email isn't configured.");
  const db = getDb();
  const [person] = await db
    .select({ email: people.email })
    .from(people)
    .where(eq(people.id, personId));
  const [company] = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId));
  if (!person?.email || !company) throw new Error("Missing email or company.");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "historicgrovecenter.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const claimUrl = `${proto}://${host}/auth/sign-in?mode=signup&returnTo=/account&email=${encodeURIComponent(person.email)}`;

  await sendMerchantInvite({
    email: person.email,
    businessName: company.name,
    claimUrl,
  });
}

export async function removeCompanyOwner(
  companyId: number,
  personId: number,
): Promise<void> {
  await assertAdmin();
  const roleId = await merchantRoleId();
  if (!roleId) return;
  await getDb()
    .delete(roleAssignments)
    .where(
      and(
        eq(roleAssignments.personId, personId),
        eq(roleAssignments.roleId, roleId),
        eq(roleAssignments.scope, "company"),
        eq(roleAssignments.scopeId, companyId),
      ),
    );
  revalidatePath(`/admin/companies/${companyId}`);
}
