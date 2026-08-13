"use server";

/*
 * Merchant self-service actions. A signed-in merchant edits ONLY the companies
 * they manage (company-scoped `merchant` role); admins can manage any. Edits
 * are live immediately — the public directory reads these rows directly. The
 * `published` flag (initial go-live) is NOT editable here; that's admin-gated.
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { companies } from "@/db/schema";
import sanitizeHtml from "sanitize-html";
import { getActor, canManageCompany } from "@/lib/auth/authorize";
import { normalizeWeekHours, type WeekHours } from "@/lib/hours";

export type MerchantListingInput = {
  companyId: number;
  name: string;
  category?: string;
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
      category: clean(input.category),
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
