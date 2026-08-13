/*
 * Merchant self-service data access (server-only).
 *
 * "My businesses" = companies where the signed-in person holds the
 * company-scoped `merchant` role. Admins can manage any company (they also see
 * it here if they happen to hold a merchant role), but the console is the
 * admin surface — this is the merchant surface.
 */

import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  companies,
  media,
  mediaAttachments,
  people,
  roleAssignments,
  roles,
} from "@/db/schema";
import { canManageCompany, type Actor } from "@/lib/auth/authorize";
import { mediaUrl } from "@/lib/media";
import { normalizeCategories } from "@/lib/merchants";
import { normalizeWeekHours, type WeekHours } from "@/lib/hours";

export type MediaRef = { id: number; url: string };

export type ManagedCompany = {
  id: number;
  slug: string | null;
  name: string;
  category: string | null;
  tagline: string | null;
  published: boolean;
};

export type EditableCompany = {
  id: number;
  slug: string | null;
  name: string;
  categories: string[];
  tagline: string | null;
  description: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
  hoursByDay: WeekHours;
  address: string | null;
  facebook: string | null;
  instagram: string | null;
  logo: MediaRef | null;
  gallery: MediaRef[];
  published: boolean;
};

export const GALLERY_LIMIT = 3;

export type CompanyOwner = { personId: number; name: string; email: string | null };

/** People who manage a company (hold the company-scoped `merchant` role). */
export async function getCompanyOwners(companyId: number): Promise<CompanyOwner[]> {
  try {
    const rows = await getDb()
      .select({
        personId: people.id,
        first: people.firstName,
        last: people.lastName,
        email: people.email,
      })
      .from(roleAssignments)
      .innerJoin(roles, and(eq(roles.id, roleAssignments.roleId), eq(roles.key, "merchant")))
      .innerJoin(people, eq(people.id, roleAssignments.personId))
      .where(
        and(eq(roleAssignments.scope, "company"), eq(roleAssignments.scopeId, companyId)),
      );
    return rows.map((r) => ({
      personId: r.personId,
      name: [r.first, r.last].filter(Boolean).join(" ") || r.email || "Unnamed",
      email: r.email,
    }));
  } catch (err) {
    console.error("getCompanyOwners failed", err);
    return [];
  }
}

/** Company ids the actor manages as a merchant (company-scoped role). */
export function managedCompanyIds(actor: Actor): number[] {
  return [
    ...new Set(
      actor.roles
        .filter((r) => r.scope === "company" && r.key === "merchant" && r.scopeId != null)
        .map((r) => r.scopeId as number),
    ),
  ];
}

/** The actor's businesses, for the dashboard list. */
export async function getManagedCompanies(actor: Actor): Promise<ManagedCompany[]> {
  const ids = managedCompanyIds(actor);
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select({
      id: companies.id,
      slug: companies.slug,
      name: companies.name,
      category: companies.category,
      tagline: companies.tagline,
      published: companies.published,
    })
    .from(companies)
    .where(inArray(companies.id, ids))
    .orderBy(asc(companies.name));
  return rows;
}

/** A single company the actor is allowed to edit, or null. */
export async function getEditableCompany(
  actor: Actor,
  companyId: number,
): Promise<EditableCompany | null> {
  if (!canManageCompany(actor, companyId)) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(companies)
    .where(inArray(companies.id, [companyId]))
    .limit(1);
  if (!row) return null;
  const social = (row.socialLinks ?? {}) as Record<string, string | undefined>;

  let logo: MediaRef | null = null;
  if (row.logoMediaId) {
    const [lm] = await db
      .select({ id: media.id, r2Key: media.r2Key })
      .from(media)
      .where(eq(media.id, row.logoMediaId))
      .limit(1);
    if (lm) logo = { id: lm.id, url: mediaUrl(lm) };
  }

  const gal = await db
    .select({ id: media.id, r2Key: media.r2Key })
    .from(mediaAttachments)
    .innerJoin(media, eq(media.id, mediaAttachments.mediaId))
    .where(
      and(
        eq(mediaAttachments.targetType, "company"),
        eq(mediaAttachments.targetId, companyId),
        eq(mediaAttachments.purpose, "gallery"),
      ),
    )
    .orderBy(asc(mediaAttachments.sortOrder), asc(mediaAttachments.id));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categories: normalizeCategories(row.categories),
    tagline: row.tagline,
    description: row.description,
    hours: row.hours,
    phone: row.phone,
    website: row.website,
    hoursByDay: normalizeWeekHours(row.hoursByDay),
    address: row.addressLine,
    facebook: social.facebook ?? null,
    instagram: social.instagram ?? null,
    logo,
    gallery: gal.map((g) => ({ id: g.id, url: mediaUrl(g) })),
    published: row.published,
  };
}
