import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { themes, siteSettings } from "@/db/schema";
import { getActiveTheme, THEME_OVERRIDE_KEY } from "@/lib/theme";
import { normalizePalette } from "@/lib/theme-shared";
import ThemesPanel from "@/components/admin/ThemesPanel";

export const dynamic = "force-dynamic";

export default async function AppearancePage() {
  const db = getDb();
  const [rawRows, active, ov] = await Promise.all([
    db
      .select({
        id: themes.id,
        name: themes.name,
        isDefault: themes.isDefault,
        palette: themes.palette,
      })
      .from(themes)
      .orderBy(asc(themes.id)),
    getActiveTheme(),
    db.select().from(siteSettings).where(eq(siteSettings.key, THEME_OVERRIDE_KEY)),
  ]);
  const rows = rawRows.map((r) => ({
    id: r.id,
    name: r.name,
    isDefault: r.isDefault,
    palette: normalizePalette(r.palette),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/admin/site" className="text-sm text-grove hover:underline">
        ← Site
      </Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-grove">
        Appearance &amp; themes
      </h1>
      <p className="mt-1 text-sm text-muted">
        Color palettes for the site. Create seasonal themes, edit their colors,
        and schedule when they turn on.
      </p>

      <ThemesPanel
        themes={rows}
        activeName={active.name}
        activeSource={active.source}
        overrideId={ov[0]?.value ? Number(ov[0].value) : null}
      />
    </div>
  );
}
