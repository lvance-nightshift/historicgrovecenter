import Image from "next/image";
import type { Sponsor } from "@/lib/sponsors";

/**
 * "Our Sponsors" wall for an event page. The presenting sponsor (if any) is
 * shown larger, above a grid of the rest. Logos sit on white cards so both
 * light and dark marks read cleanly. Renders nothing when there are no sponsors.
 */
export default function SponsorsWall({ sponsors }: { sponsors: Sponsor[] }) {
  if (!sponsors || sponsors.length === 0) return null;

  const presenting = sponsors.filter((s) => s.presenting);
  const rest = sponsors.filter((s) => !s.presenting);

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="text-center font-serif text-2xl font-semibold text-grove">
        Our Sponsors
      </h2>
      <p className="mt-1 text-center text-sm text-muted">
        With gratitude to the businesses making this event possible.
      </p>

      {presenting.length > 0 && (
        <div className="mt-7 flex flex-col items-center gap-4">
          {presenting.map((s) => (
            <div key={s.name} className="flex flex-col items-center">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brick">
                Presenting Sponsor
              </span>
              <LogoCard sponsor={s} className="mt-2 px-8 py-6" imgClass="max-h-24" />
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {rest.map((s) => (
            <LogoCard key={s.name} sponsor={s} className="px-5 py-5" imgClass="max-h-14" />
          ))}
        </div>
      )}
    </section>
  );
}

function LogoCard({
  sponsor,
  className,
  imgClass,
}: {
  sponsor: Sponsor;
  className: string;
  imgClass: string;
}) {
  const img = (
    <Image
      src={sponsor.logoUrl}
      alt={sponsor.name}
      width={sponsor.width ?? 400}
      height={sponsor.height ?? 200}
      sizes="(min-width: 640px) 240px, 45vw"
      className={`${imgClass} w-auto object-contain`}
    />
  );
  const base = `flex items-center justify-center rounded-xl border border-border bg-white shadow-sm ${className}`;
  return sponsor.website ? (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noopener noreferrer sponsored"
      title={sponsor.name}
      className={`${base} transition-shadow hover:shadow-md`}
    >
      {img}
    </a>
  ) : (
    <div className={base} title={sponsor.name}>
      {img}
    </div>
  );
}
