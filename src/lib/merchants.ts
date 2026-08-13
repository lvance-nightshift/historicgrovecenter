/*
 * Merchant directory — shared types (client-safe).
 *
 * The actual data now lives in the database (the `companies` table, published
 * rows tagged with the `merchant` kind). Server code fetches it via
 * src/lib/merchants-db.ts; this module only holds the shape + category list so
 * client components (filters, cards, the dashboard form) can import it freely.
 */

export type MerchantCategory =
  | "Dining"
  | "Shopping"
  | "Services"
  | "Health & Beauty"
  | "Arts & Culture";

export const CATEGORIES: MerchantCategory[] = [
  "Dining",
  "Shopping",
  "Services",
  "Health & Beauty",
  "Arts & Culture",
];

/** Coerce stored JSON into a clean list of known categories. */
export function normalizeCategories(raw: unknown): string[] {
  const known = new Set<string>(CATEGORIES);
  const arr = Array.isArray(raw) ? raw : [];
  return [...new Set(arr.filter((c): c is string => typeof c === "string" && known.has(c)))];
}

import type { WeekHours } from "./hours";

export type Merchant = {
  slug: string;
  name: string;
  categories?: string[]; // subset of CATEGORIES
  tagline?: string;
  description?: string;
  phone?: string;
  website?: string;
  hours?: string; // freeform note (holidays, "by appointment", …)
  hoursByDay?: WeekHours; // structured weekly hours
  address?: string;
  logoUrl?: string;
  gallery?: string[]; // photo URLs (detail page)
  facebook?: string;
  instagram?: string;
};
