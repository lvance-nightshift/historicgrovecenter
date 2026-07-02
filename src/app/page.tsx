import Link from "next/link";
import EventCard from "@/components/EventCard";
import MerchantCard from "@/components/MerchantCard";
import { upcomingEvents } from "@/lib/events";
import { merchants } from "@/lib/merchants";
import { site } from "@/lib/site";

export default function Home() {
  const featuredEvents = upcomingEvents().slice(0, 3);
  const featuredMerchants = merchants.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-grove text-background">
        {/* Decorative sunburst / mid-century motif */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-conic-gradient(from 0deg at 80% 20%, var(--brass-light) 0deg 6deg, transparent 6deg 18deg)",
          }}
          aria-hidden
        />
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
      </section>

      {/* Intro / three pillars */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "A living landmark",
              body: "One of Oak Ridge's four original shopping centers, Grove Center still centers daily life on the city's east side.",
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

      {/* Featured events */}
      <section className="bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brick">
                Mark your calendar
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-grove">
                Upcoming at the Center
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

      {/* History teaser */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative">
            {/* Placeholder "photo" block — swap for a real historic image */}
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border bg-grove/5 text-center">
              <div className="px-6">
                <p className="font-serif text-2xl italic text-grove/60">
                  Historic photo
                </p>
                <p className="mt-2 text-sm text-muted">
                  Add a vintage image of Grove Center here
                </p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl bg-brass/20" />
          </div>
          <div>
            <div className="rule-brass" />
            <h2 className="mt-4 font-serif text-3xl font-semibold text-grove">
              A shopping center born of the Secret City
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              When Oak Ridge rose almost overnight in the 1940s to enrich
              uranium for the Manhattan Project, its planners built
              self-contained neighborhoods — each with its own shopping center.
              Grove Center opened to serve the city&apos;s growing east side,
              its Grove Theater marquee glowing over a main street of shops,
              a soda fountain, and a gathering place that outlasted the war
              that made it.
            </p>
            <Link
              href="/history"
              className="mt-6 inline-block font-semibold text-grove hover:underline"
            >
              Read the full story →
            </Link>
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

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm sm:p-14">
          <h2 className="font-serif text-3xl font-semibold text-grove">
            Come spend an afternoon at the Grove.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Free parking, walkable shops, and something happening most weekends.
            We&apos;ll leave the marquee on for you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/visit"
              className="rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark"
            >
              Plan your visit
            </Link>
            <Link
              href="/events"
              className="rounded-full border border-grove/30 px-6 py-3 font-semibold text-grove transition-colors hover:bg-grove/5"
            >
              Browse events
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
