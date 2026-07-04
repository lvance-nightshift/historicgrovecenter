/*
 * Server-side theme resolution + injection.
 *
 * Active theme is chosen each request:
 *   1. manual override (site_settings) — trumps everything
 *   2. a schedule whose month/day window covers today — highest priority wins
 *   3. the default theme
 *   4. built-in defaults (also the fallback if the DB/tables aren't ready)
 */

import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { themes, themeSchedules, siteSettings } from "@/db/schema";
import {
  DEFAULT_PALETTE,
  normalizePalette,
  paletteToCssVars,
  type Palette,
} from "./theme-shared";

export const THEME_OVERRIDE_KEY = "active_theme_override";

export type ActiveTheme = {
  id: number | null;
  name: string;
  palette: Palette;
  source: "override" | "schedule" | "default" | "builtin";
};

/** Is (month,day) inside a recurring window, handling year-end wrap? */
export function inWindow(
  month: number,
  day: number,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): boolean {
  const x = month * 100 + day;
  const s = startMonth * 100 + startDay;
  const e = endMonth * 100 + endDay;
  return s <= e ? x >= s && x <= e : x >= s || x <= e;
}

async function resolveActiveTheme(now: Date): Promise<ActiveTheme> {
  const db = getDb();

  // 1. manual override
  const [ov] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, THEME_OVERRIDE_KEY));
  if (ov?.value) {
    const [t] = await db.select().from(themes).where(eq(themes.id, Number(ov.value)));
    if (t)
      return {
        id: t.id,
        name: t.name,
        palette: normalizePalette(t.palette as Palette),
        source: "override",
      };
  }

  // 2. scheduled (seasonal)
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const schedules = await db
    .select()
    .from(themeSchedules)
    .where(eq(themeSchedules.enabled, true));
  const match = schedules
    .filter((s) => inWindow(month, day, s.startMonth, s.startDay, s.endMonth, s.endDay))
    .sort((a, b) => b.priority - a.priority)[0];
  if (match) {
    const [t] = await db.select().from(themes).where(eq(themes.id, match.themeId));
    if (t)
      return {
        id: t.id,
        name: t.name,
        palette: normalizePalette(t.palette as Palette),
        source: "schedule",
      };
  }

  // 3. default theme
  const [def] = await db.select().from(themes).where(eq(themes.isDefault, true));
  if (def)
    return {
      id: def.id,
      name: def.name,
      palette: normalizePalette(def.palette as Palette),
      source: "default",
    };

  // 4. built-in
  return { id: null, name: "Default", palette: DEFAULT_PALETTE, source: "builtin" };
}

/** Active theme, never throws (falls back to built-in defaults). */
export async function getActiveTheme(now: Date = new Date()): Promise<ActiveTheme> {
  try {
    return await resolveActiveTheme(now);
  } catch {
    return { id: null, name: "Default", palette: DEFAULT_PALETTE, source: "builtin" };
  }
}

/** The :root override to inject site-wide. */
export function activeThemeCss(theme: ActiveTheme): string {
  return `:root{${paletteToCssVars(theme.palette)}}`;
}
