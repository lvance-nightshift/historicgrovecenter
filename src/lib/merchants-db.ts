/*
 * Merchant directory — data access (server-only).
 *
 * Reads published `companies` tagged with the `merchant` kind and maps them to
 * the client-safe `Merchant` shape. Resilient: returns [] / null if the DB
 * isn't configured yet, so pages render without crashing.
 */

import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  companies,
  companyKinds,
  companyKindAssignments,
  media,
} from "@/db/schema";
import type { Merchant } from "./merchants";
import { normalizeWeekHours } from "./hours";

type Row = {
  slug: string | null;
  name: string;
  category: string | null;
  tagline: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  hoursByDay: unknown;
  address: string | null;
  socialLinks: unknown;
  logoKey: string | null;
};

function publicUrl(key: string | null): string | undefined {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !key) return undefined;
  return `${base.replace(/\/$/, "")}/${key}`;
}

function toMerchant(r: Row): Merchant | null {
  if (!r.slug) return null;
  const social = (r.socialLinks ?? {}) as Record<string, string | undefined>;
  return {
    slug: r.slug,
    name: r.name,
    category: r.category ?? undefined,
    tagline: r.tagline ?? undefined,
    description: r.description ?? undefined,
    phone: r.phone ?? undefined,
    website: r.website ?? undefined,
    hours: r.hours ?? undefined,
    hoursByDay: normalizeWeekHours(r.hoursByDay),
    address: r.address ?? undefined,
    logoUrl: publicUrl(r.logoKey),
    facebook: social.facebook || undefined,
    instagram: social.instagram || undefined,
  };
}

const selection = {
  slug: companies.slug,
  name: companies.name,
  category: companies.category,
  tagline: companies.tagline,
  description: companies.description,
  phone: companies.phone,
  website: companies.website,
  hours: companies.hours,
  hoursByDay: companies.hoursByDay,
  address: companies.addressLine,
  socialLinks: companies.socialLinks,
  logoKey: media.r2Key,
};

/** All published merchants, alphabetized. */
export async function getMerchants(): Promise<Merchant[]> {
  try {
    const rows = await getDb()
      .select(selection)
      .from(companies)
      .innerJoin(
        companyKindAssignments,
        eq(companyKindAssignments.companyId, companies.id),
      )
      .innerJoin(
        companyKinds,
        and(
          eq(companyKinds.id, companyKindAssignments.kindId),
          eq(companyKinds.key, "merchant"),
        ),
      )
      .leftJoin(media, eq(media.id, companies.logoMediaId))
      .where(eq(companies.published, true))
      .orderBy(asc(companies.name));
    return rows.map(toMerchant).filter((m): m is Merchant => m !== null);
  } catch (err) {
    console.error("getMerchants failed", err);
    return [];
  }
}

/** A single published merchant by slug, or null. */
export async function getMerchantBySlug(slug: string): Promise<Merchant | null> {
  try {
    const [row] = await getDb()
      .select(selection)
      .from(companies)
      .leftJoin(media, eq(media.id, companies.logoMediaId))
      .where(and(eq(companies.slug, slug), eq(companies.published, true)))
      .limit(1);
    return row ? toMerchant(row) : null;
  } catch (err) {
    console.error("getMerchantBySlug failed", err);
    return null;
  }
}
