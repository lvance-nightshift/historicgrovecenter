"use server";

/*
 * Merchant self-service actions. A signed-in merchant edits ONLY the companies
 * they manage (company-scoped `merchant` role); admins can manage any. Edits
 * are live immediately — the public directory reads these rows directly. The
 * `published` flag (initial go-live) is NOT editable here; that's admin-gated.
 */

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { companies, mediaAttachments } from "@/db/schema";
import sanitizeHtml from "sanitize-html";
import { getActor, canManageCompany } from "@/lib/auth/authorize";
import { GALLERY_LIMIT } from "@/lib/account";
import { normalizeCategories } from "@/lib/merchants";
import { getCategoryNames } from "@/lib/categories";
import { normalizeWeekHours, type WeekHours } from "@/lib/hours";

async function assertCanManage(companyId: number) {
  const actor = await getActor();
  if (!actor || !canManageCompany(actor, companyId)) throw new Error("Forbidden");
}

/** Revalidate every public/admin surface that shows a company. */
async function revalidateCompany(companyId: number) {
  revalidatePath("/");
  revalidatePath("/merchants");
  const [row] = await getDb()
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, companyId));
  if (row?.slug) revalidatePath(`/merchants/${row.slug}`);
  revalidatePath("/account");
  revalidatePath(`/account/business/${companyId}`);
}

function galleryWhere(companyId: number) {
  return and(
    eq(mediaAttachments.targetType, "company"),
    eq(mediaAttachments.targetId, companyId),
    eq(mediaAttachments.purpose, "gallery"),
  );
}

export type MerchantListingInput = {
  companyId: number;
  name: string;
  categories?: string[];
  tagline?: string;
  description?: string;
  hours?: string;
  hoursByDay?: WeekHours;
  phone?: string;
  website?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
};

function clean(v?: string): string | null {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

/** Sanitize merchant-authored rich text down to a safe formatting subset. */
function richText(v?: string): string | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  const cleaned = sanitizeHtml(t, {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li", "a", "blockquote"],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  }).trim();
  // Empty once tags are stripped (e.g. "<p></p>") → treat as no description.
  return cleaned.replace(/<[^>]+>/g, "").trim().length ? cleaned : null;
}

/** Normalize a URL-ish value: add https:// if it looks like a bare domain. */
function url(v?: string): string | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export async function updateMyCompany(input: MerchantListingInput): Promise<void> {
  const actor = await getActor();
  if (!actor || !canManageCompany(actor, input.companyId)) {
    throw new Error("Forbidden");
  }
  const name = input.name.trim();
  if (!name) throw new Error("Business name is required.");

  const validCategories = new Set(await getCategoryNames());
  const categories = normalizeCategories(input.categories).filter((c) =>
    validCategories.has(c),
  );

  const facebook = url(input.facebook);
  const instagram = url(input.instagram);
  const socialLinks =
    facebook || instagram
      ? { ...(facebook ? { facebook } : {}), ...(instagram ? { instagram } : {}) }
      : null;

  await getDb()
    .update(companies)
    .set({
      name,
      categories,
      tagline: clean(input.tagline),
      description: richText(input.description),
      hours: clean(input.hours),
      phone: clean(input.phone),
      website: url(input.website),
      addressLine: clean(input.address),
      socialLinks,
      hoursByDay: normalizeWeekHours(input.hoursByDay),
      updatedAt: new Date(),
    })
    .where(eq(companies.id, input.companyId));

  // Live surfaces that show this merchant.
  revalidatePath("/");
  revalidatePath("/merchants");
  const [row] = await getDb()
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, input.companyId));
  if (row?.slug) revalidatePath(`/merchants/${row.slug}`);
  revalidatePath("/account");
  revalidatePath(`/account/business/${input.companyId}`);
}

/* ---------------- Logo & photo gallery ---------------- */

export async function setMyCompanyLogo(
  companyId: number,
  mediaId: number | null,
): Promise<void> {
  await assertCanManage(companyId);
  await getDb()
    .update(companies)
    .set({ logoMediaId: mediaId, updatedAt: new Date() })
    .where(eq(companies.id, companyId));
  await revalidateCompany(companyId);
}

export async function addMyCompanyPhoto(
  companyId: number,
  mediaId: number,
): Promise<void> {
  await assertCanManage(companyId);
  const db = getDb();
  const existing = await db
    .select({ id: mediaAttachments.id, mediaId: mediaAttachments.mediaId })
    .from(mediaAttachments)
    .where(galleryWhere(companyId));
  if (existing.some((e) => e.mediaId === mediaId)) return; // already attached
  if (existing.length >= GALLERY_LIMIT) {
    throw new Error(`Photo limit reached (${GALLERY_LIMIT}).`);
  }
  await db.insert(mediaAttachments).values({
    mediaId,
    targetType: "company",
    targetId: companyId,
    purpose: "gallery",
    sortOrder: existing.length,
  });
  await revalidateCompany(companyId);
}

export async function removeMyCompanyPhoto(
  companyId: number,
  mediaId: number,
): Promise<void> {
  await assertCanManage(companyId);
  await getDb()
    .delete(mediaAttachments)
    .where(and(galleryWhere(companyId), eq(mediaAttachments.mediaId, mediaId)));
  await revalidateCompany(companyId);
}
