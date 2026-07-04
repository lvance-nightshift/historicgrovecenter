import { getSiteMedia } from "@/lib/media";
import HeroManager from "@/components/admin/HeroManager";

export const dynamic = "force-dynamic";

export default async function AdminSitePage() {
  const hero = await getSiteMedia("home_hero");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-grove">Site</h1>
      <p className="mt-1 text-sm text-muted">
        Appearance and imagery for the public site.
      </p>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-grove">
          Home hero image
        </h2>
        <p className="mt-1 text-sm text-muted">
          The large image behind the headline on the home page. Pick one from
          the library (or upload a new one), then set it.
        </p>
        <HeroManager
          current={hero ? { id: hero.id, url: hero.url, filename: hero.filename } : null}
        />
      </section>
    </div>
  );
}
