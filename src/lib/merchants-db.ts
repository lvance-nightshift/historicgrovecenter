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
  mediaAttachments,
} from "@/db/schema";
import type { Merchant } from "./merchants";
import { normalizeCategories } from "./merchants";
import { normalizeWeekHours } from "./hours";

type Row = {
  slug: string | null;
  name: string;
  categories: unknown;
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
    categories: normalizeCategories(r.categories),
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
  categories: companies.categories,
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

/** A single published merchant by slug (with photo gallery), or null. */
export async function getMerchantBySlug(slug: string): Promise<Merchant | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ ...selection, id: companies.id })
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
      .where(and(eq(companies.slug, slug), eq(companies.published, true)))
      .limit(1);
    if (!row) return null;
    const merchant = toMerchant(row);
    if (!merchant) return null;

    const galleryRows = await db
      .select({ r2Key: media.r2Key })
      .from(mediaAttachments)
      .innerJoin(media, eq(media.id, mediaAttachments.mediaId))
      .where(
        and(
          eq(mediaAttachments.targetType, "company"),
          eq(mediaAttachments.targetId, row.id),
          eq(mediaAttachments.purpose, "gallery"),
        ),
      )
      .orderBy(asc(mediaAttachments.sortOrder), asc(mediaAttachments.id));
    merchant.gallery = galleryRows
      .map((g) => publicUrl(g.r2Key))
      .filter((u): u is string => Boolean(u));
    return merchant;
  } catch (err) {
    console.error("getMerchantBySlug failed", err);
    return null;
  }
}
