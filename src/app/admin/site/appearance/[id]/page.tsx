import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { themes, themeSchedules } from "@/db/schema";
import { normalizePalette, type Palette } from "@/lib/theme-shared";
import ThemePaletteEditor from "@/components/admin/ThemePaletteEditor";
import ScheduleManager from "@/components/admin/ScheduleManager";

export const dynamic = "force-dynamic";

export default async function ThemeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const db = getDb();
  const [theme] = await db.select().from(themes).where(eq(themes.id, id));
  if (!theme) notFound();
  const schedules = await db
    .select()
    .from(themeSchedules)
    .where(eq(themeSchedules.themeId, id))
    .orderBy(asc(themeSchedules.id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/admin/site/appearance" className="text-sm text-grove hover:underline">
        ← Themes
      </Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-grove">
        {theme.name}
        {theme.isDefault && (
          <span className="ml-2 align-middle text-xs font-normal text-muted">(default)</span>
        )}
      </h1>

      <section className="mt-8">
        <ThemePaletteEditor
          themeId={id}
          name={theme.name}
          palette={normalizePalette(theme.palette as Palette)}
        />
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="font-serif text-xl font-semibold text-grove">Seasonal schedule</h2>
        <p className="mt-1 text-sm text-muted">
          Turn this theme on automatically during a date window each year. Higher
          priority wins when windows overlap.
        </p>
        <ScheduleManager themeId={id} schedules={schedules} />
      </section>
    </div>
  );
}
