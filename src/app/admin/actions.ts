"use server";

/*
 * Admin console mutations. Every action is gated to admins (developer /
 * association_admin) via assertAdmin(). Typed args, called from client
 * components; each revalidates the affected path.
 */

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  people,
  companies,
  companyKindAssignments,
  companyMemberships,
  roleAssignments,
} from "@/db/schema";
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
      slug: clean(input.slug),
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
