import Link from "next/link";
import Image from "next/image";
import EventCard from "@/components/EventCard";
import MerchantCard from "@/components/MerchantCard";
import { getPublicEvents } from "@/lib/events-db";
import { getMerchants } from "@/lib/merchants-db";
import { site } from "@/lib/site";
import { getSiteMedia } from "@/lib/media";
import { PUMPKIN_FEST as PF } from "@/lib/pumpkin-fest";

// Reads the current hero from the DB each request so admin changes show
// immediately (the admin action also revalidates this path).
export const dynamic = "force-dynamic";

export default async function Home() {
  const featuredEvents = (await getPublicEvents()).upcoming.slice(0, 3);
  const featuredMerchants = (await getMerchants()).slice(0, 3);
  const hero = await getSiteMedia("home_hero");
  // Feature the Pumpkin Fest vendor call while the fest is still upcoming;
  // afterward the homepage falls back to the three "pillars" blurb.
  const pumpkinUpcoming = Date.now() < new Date(PF.endAtISO).getTime();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-grove text-background">
        {hero ? (
          <>
            {/* Uploaded hero image + overlay so the text stays readable */}
            <Image
              src={hero.url}
              alt={hero.altText ?? ""}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-grove/70" aria-hidden />
          </>
        ) : (
          /* Decorative sunburst / mid-century motif (fallback) */
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-conic-gradient(from 0deg at 80% 20%, var(--brass-light) 0deg 6deg, transparent 6deg 18deg)",
            }}
            aria-hidden
          />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="font-medium uppercase tracking-[0.25em] text-brass-light">
            {site.city} · Est. 1949
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            The heart of Oak Ridge&apos;s original neighborhood.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-background/85">
            Built for the workers of the Manhattan Project&apos;s Secret City,
            Grove Center has gathered neighbors for good food, good shops, and
            good company for more than seventy years — and still does.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/events"
              className="rounded-full bg-brass px-6 py-3 font-semibold text-grove-dark shadow-sm transition-colors hover:bg-brass-light"
            >
              See what&apos;s happening
            </Link>
            <Link
              href="/merchants"
              className="rounded-full border border-background/30 px-6 py-3 font-semibold text-background transition-colors hover:bg-background/10"
            >
              Meet the merchants
            </Link>
          </div>
        </div>
        {hero?.credit && (
          <p className="absolute bottom-2 right-3 z-10 text-[0.65rem] text-background/60">
            {hero.credit}
          </p>
        )}
      </section>

      {/* Pumpkin Fest vendor call (while upcoming) — otherwise the three pillars */}
      {pumpkinUpcoming ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-brass/40 bg-gradient-to-br from-brass/15 via-surface to-brick/10 p-8 shadow-sm sm:p-12">
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brick">
                  🎃 {PF.dateLabel} · {PF.hoursLabel}
                </p>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-grove sm:text-4xl">
                  Fall Pumpkin Fest
                </h2>
                <p className="mt-3 leading-relaxed text-muted">
                  Music, pumpkins, a petting zoo &amp; a pet costume contest — a
                  free community day benefiting SARG Inc., Local Arts &amp; the
                  Historic Grove Theater. Artisan, craft &amp; food vendors welcome,
                  too.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3">
                <a
                  href={PF.eventbriteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-grove px-7 py-3.5 text-center font-semibold text-background shadow-sm transition-colors hover:bg-grove-dark"
                >
                  Register to attend (free) ↗
                </a>
                <Link
                  href="/pumpkin-fest"
                  className="rounded-full border border-grove/40 px-7 py-3.5 text-center font-semibold text-grove transition-colors hover:bg-grove/10"
                >
                  Become a vendor →
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "A living landmark",
                body: "One of Oak Ridge's four original shopping centers, the Grove Center still centers daily life on the city's east side.",
              },
              {
                title: "Independent merchants",
                body: "Locally owned shops, makers, and eateries — many here for generations — anchor the Merchants Association.",
              },
              {
                title: "Gatherings all year",
                body: "Night markets, film nights at the Grove Theater, seasonal festivals, and history walks bring the courtyard alive.",
              },
            ].map((pillar) => (
              <div key={pillar.title}>
                <div className="rule-brass" />
                <h2 className="mt-4 font-serif text-xl font-semibold text-grove">
                  {pillar.title}
                </h2>
                <p className="mt-2 leading-relaxed text-muted">{pillar.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured events */}
      <section className="bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brick">
                Mark your calendar
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-grove">
                Upcoming at the Grove Center
              </h2>
            </div>
            <Link
              href="/events"
              className="font-semibold text-grove hover:underline"
            >
              View full calendar →
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.length > 0 ? (
              featuredEvents.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))
            ) : (
              <p className="text-muted">
                No upcoming events posted yet — check back soon.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured merchants */}
      <section className="bg-grove-dark text-background">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass-light">
                Shop local
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold">
                A few of our merchants
              </h2>
            </div>
            <Link
              href="/merchants"
              className="font-semibold text-brass-light hover:underline"
            >
              See the full directory →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredMerchants.map((merchant) => (
              <MerchantCard key={merchant.slug} merchant={merchant} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
