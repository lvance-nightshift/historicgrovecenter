/*
 * Merchant self-service data access (server-only).
 *
 * "My businesses" = companies where the signed-in person holds the
 * company-scoped `merchant` role. Admins can manage any company (they also see
 * it here if they happen to hold a merchant role), but the console is the
 * admin surface — this is the merchant surface.
 */

import "server-only";
import { asc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { companies } from "@/db/schema";
import { canManageCompany, type Actor } from "@/lib/auth/authorize";

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
  category: string | null;
  tagline: string | null;
  description: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  facebook: string | null;
  instagram: string | null;
  published: boolean;
};

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
  const [row] = await getDb()
    .select()
    .from(companies)
    .where(inArray(companies.id, [companyId]))
    .limit(1);
  if (!row) return null;
  const social = (row.socialLinks ?? {}) as Record<string, string | undefined>;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    tagline: row.tagline,
    description: row.description,
    hours: row.hours,
    phone: row.phone,
    website: row.website,
    address: row.addressLine,
    facebook: social.facebook ?? null,
    instagram: social.instagram ?? null,
    published: row.published,
  };
}
