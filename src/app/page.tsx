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
  // Feature the October events while they're still upcoming; afterward the
  // homepage falls back to the three "pillars" blurb.
  const now = Date.now();
  const HARVEST_TICKETS =
    "https://www.eventbrite.com/e/oak-ridge-harvest-table-tickets-1995108133133";
  const harvestUpcoming = now < new Date("2026-10-17T04:00:00.000Z").getTime();
  const pumpkinUpcoming = now < new Date(PF.endAtISO).getTime();

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
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-medium uppercase tracking-[0.25em] text-brass-light">
            {site.city} · Est. 1949
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            The heart of Oak Ridge&apos;s original neighborhood.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-background/85">
            Built for the workers of the Manhattan Project&apos;s Secret City,
            Grove Center has gathered neighbors for good food, good shops, and
            good company for more than seventy years — and still does.
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
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

      {/* Featured October events (while upcoming) — otherwise the three pillars */}
      {harvestUpcoming || pumpkinUpcoming ? (
        <section className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
          {harvestUpcoming && (
            <FeaturedBanner
              eyebrow="🍂 Friday, October 16 · 5 PM"
              title="Oak Ridge Harvest Table"
              blurb="A black-tie dinner & mural ribbon-cutting celebrating the arts — benefiting the local arts community."
              actions={[{ href: HARVEST_TICKETS, label: "Get tickets ↗", external: true, primary: true }]}
            />
          )}
          {pumpkinUpcoming && (
            <FeaturedBanner
              eyebrow={`🎃 ${PF.dateLabel} · ${PF.hoursLabel}`}
              title="Fall Pumpkin Fest"
              blurb="A free community day — music, pumpkins, a petting zoo & pet costume contest. Vendors welcome, too."
              actions={[
                { href: PF.eventbriteUrl, label: "Register (free) ↗", external: true, primary: true },
                { href: "/pumpkin-fest", label: "Become a vendor →" },
              ]}
            />
          )}
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "A living landmark",
                body: "One of Oak Ridge's four original shopping centers, the Grove Center still anchors daily life in the heart of the city.",
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
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
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

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
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
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featuredMerchants.map((merchant) => (
              <MerchantCard key={merchant.slug} merchant={merchant} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

type BannerAction = { href: string; label: string; external?: boolean; primary?: boolean };

/** Compact promo banner for a featured event. */
function FeaturedBanner({
  eyebrow,
  title,
  blurb,
  actions,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  actions: BannerAction[];
}) {
  const cls = (primary?: boolean) =>
    primary
      ? "rounded-full bg-grove px-5 py-2.5 text-center text-sm font-semibold text-background shadow-sm transition-colors hover:bg-grove-dark"
      : "rounded-full border border-grove/40 px-5 py-2.5 text-center text-sm font-semibold text-grove transition-colors hover:bg-grove/10";
  return (
    <div className="overflow-hidden rounded-xl border border-brass/40 bg-gradient-to-br from-brass/12 via-surface to-brick/10 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brick">
            {eyebrow}
          </p>
          <h3 className="mt-1 font-serif text-2xl font-semibold text-grove">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{blurb}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          {actions.map((a) =>
            a.external ? (
              <a
                key={a.label}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cls(a.primary)}
              >
                {a.label}
              </a>
            ) : (
              <Link key={a.label} href={a.href} className={cls(a.primary)}>
                {a.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
