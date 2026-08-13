/*
 * Merchant directory categories — data access (server-only).
 * Editable master list in `merchant_categories`. Falls back to the built-in
 * defaults if the table is empty / unreachable so the UI never comes up blank.
 */

import "server-only";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { merchantCategories } from "@/db/schema";
import { CATEGORIES } from "@/lib/merchants";

export async function getCategoryNames(): Promise<string[]> {
  try {
    const rows = await getDb()
      .select({ name: merchantCategories.name })
      .from(merchantCategories)
      .orderBy(asc(merchantCategories.sortOrder), asc(merchantCategories.name));
    return rows.length ? rows.map((r) => r.name) : [...CATEGORIES];
  } catch (err) {
    console.error("getCategoryNames failed", err);
    return [...CATEGORIES];
  }
}

export async function getCategoriesFull(): Promise<{ id: number; name: string }[]> {
  try {
    return await getDb()
      .select({ id: merchantCategories.id, name: merchantCategories.name })
      .from(merchantCategories)
      .orderBy(asc(merchantCategories.sortOrder), asc(merchantCategories.name));
  } catch (err) {
    console.error("getCategoriesFull failed", err);
    return [];
  }
}
