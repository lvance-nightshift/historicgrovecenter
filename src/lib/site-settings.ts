/*
 * Editable Grove Center contact info (server-only).
 *
 * Stored as key/value rows in `site_settings`, overriding the static defaults
 * in src/lib/site.ts. Admins edit these at /admin/site. Reads are resilient:
 * any DB hiccup falls back to the defaults so the footer/pages never break.
 */

import "server-only";
import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { site } from "@/lib/site";

export type SiteContact = {
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  facebook: string; // "" = hidden
  instagram: string; // "" = hidden
};

// site_settings keys ↔ SiteContact fields.
export const CONTACT_KEYS = {
  email: "contact_email",
  phone: "contact_phone",
  addressLine1: "contact_address_line1",
  addressLine2: "contact_address_line2",
  facebook: "contact_facebook",
  instagram: "contact_instagram",
} as const;

/** Defaults from the static site config; socials default to hidden. */
export function contactDefaults(): SiteContact {
  return {
    email: site.email,
    phone: site.phone,
    addressLine1: site.address.line1,
    addressLine2: site.address.line2,
    facebook: "",
    instagram: "",
  };
}

/** Current contact info: stored values over defaults. Never throws. */
export async function getSiteContact(): Promise<SiteContact> {
  const defaults = contactDefaults();
  try {
    const rows = await getDb()
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, Object.values(CONTACT_KEYS)));
    const map = new Map(rows.map((r) => [r.key, r.value ?? ""]));
    const pick = (field: keyof SiteContact, fallback: string) => {
      const v = map.get(CONTACT_KEYS[field]);
      return v == null ? fallback : v; // a stored empty string is respected
    };
    return {
      email: pick("email", defaults.email) || defaults.email,
      phone: pick("phone", defaults.phone) || defaults.phone,
      addressLine1: pick("addressLine1", defaults.addressLine1) || defaults.addressLine1,
      addressLine2: pick("addressLine2", defaults.addressLine2),
      facebook: pick("facebook", ""),
      instagram: pick("instagram", ""),
    };
  } catch (err) {
    console.error("getSiteContact failed", err);
    return defaults;
  }
}
