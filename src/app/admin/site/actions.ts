"use server";

/*
 * Theming admin actions — themes (palettes), default selection, manual
 * override, and seasonal schedules. All admin-gated.
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { themes, themeSchedules, siteSettings } from "@/db/schema";
import { getActor, isAdmin } from "@/lib/auth/authorize";
import { DEFAULT_PALETTE, type Palette } from "@/lib/theme-shared";
import { THEME_OVERRIDE_KEY } from "@/lib/theme";
import { CONTACT_KEYS, type SiteContact } from "@/lib/site-settings";

async function assertAdmin() {
  const actor = await getActor();
  if (!actor || !isAdmin(actor)) throw new Error("Forbidden");
}

function slug(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "theme"}-${suffix}`;
}

function revalidateSite() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/site/appearance");
}

/* ---------------- Contact info ---------------- */

export async function updateSiteContact(input: SiteContact): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const now = new Date();
  const entries: [keyof SiteContact, string][] = [
    ["email", input.email],
    ["phone", input.phone],
    ["addressLine1", input.addressLine1],
    ["addressLine2", input.addressLine2],
    ["facebook", input.facebook],
    ["instagram", input.instagram],
  ];
  for (const [field, raw] of entries) {
    const value = (raw ?? "").trim();
    await db
      .insert(siteSettings)
      .values({ key: CONTACT_KEYS[field], value, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: now },
      });
  }
  revalidateSite(); // "/" layout covers footer, plus the contact pages
  revalidatePath("/visit");
  revalidatePath("/coming-soon");
}

/* ---------------- Themes ---------------- */

export async function createTheme(name: string): Promise<number> {
  await assertAdmin();
  const [row] = await getDb()
    .insert(themes)
    .values({
      name: name.trim() || "Untitled theme",
      slug: slug(name),
      palette: DEFAULT_PALETTE,
      isDefault: false,
    })
    .returning({ id: themes.id });
  revalidateSite();
  return row.id;
}

export async function renameTheme(id: number, name: string): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(themes)
    .set({ name: name.trim() || "Untitled theme", updatedAt: new Date() })
    .where(eq(themes.id, id));
  revalidateSite();
}

export async function updateThemePalette(
  id: number,
  palette: Palette,
): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(themes)
    .set({ palette, updatedAt: new Date() })
    .where(eq(themes.id, id));
  revalidatePath("/", "layout");
  revalidatePath(`/admin/site/appearance/${id}`);
}

export async function setDefaultTheme(id: number): Promise<void> {
  await assertAdmin();
  const db = getDb();
  await db.update(themes).set({ isDefault: false }).where(eq(themes.isDefault, true));
  await db.update(themes).set({ isDefault: true }).where(eq(themes.id, id));
  revalidateSite();
}

export async function deleteTheme(id: number): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const [t] = await db.select().from(themes).where(eq(themes.id, id));
  if (!t) return;
  if (t.isDefault) throw new Error("Can't delete the default theme.");
  await db.delete(themes).where(eq(themes.id, id));
  revalidateSite();
}

/* ---------------- Manual override (Phase 2) ---------------- */

export async function setThemeOverride(themeId: number | null): Promise<void> {
  await assertAdmin();
  const db = getDb();
  if (themeId == null) {
    await db.delete(siteSettings).where(eq(siteSettings.key, THEME_OVERRIDE_KEY));
  } else {
    await db
      .insert(siteSettings)
      .values({ key: THEME_OVERRIDE_KEY, value: String(themeId), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: String(themeId), updatedAt: new Date() },
      });
  }
  revalidateSite();
}

/* ---------------- Schedules (Phase 3) ---------------- */

export async function addSchedule(input: {
  themeId: number;
  label?: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  priority?: number;
}): Promise<void> {
  await assertAdmin();
  await getDb()
    .insert(themeSchedules)
    .values({
      themeId: input.themeId,
      label: input.label?.trim() || null,
      startMonth: input.startMonth,
      startDay: input.startDay,
      endMonth: input.endMonth,
      endDay: input.endDay,
      priority: input.priority ?? 0,
      enabled: true,
    });
  revalidateSite();
}

export async function removeSchedule(id: number): Promise<void> {
  await assertAdmin();
  await getDb().delete(themeSchedules).where(eq(themeSchedules.id, id));
  revalidateSite();
}
