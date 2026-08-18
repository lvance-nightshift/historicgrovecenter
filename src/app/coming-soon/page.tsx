import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Coming Soon",
  description:
    "Historic Grove Center — Oak Ridge's original neighborhood shopping center. Our new site is on the way.",
};

export default function ComingSoonPage() {
  // Optional hero image (env-configured so this works even before the DB is
  // migrated to production). Falls back to the sunburst motif when unset.
  const heroUrl = process.env.COMING_SOON_HERO_URL;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-grove px-6 text-center text-background">
      {heroUrl ? (
        <>
          <Image
            src={heroUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-grove/75" aria-hidden />
        </>
      ) : (
        /* Mid-century sunburst motif (fallback) */
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-conic-gradient(from 0deg at 50% 30%, var(--brass-light) 0deg 6deg, transparent 6deg 18deg)",
          }}
          aria-hidden
        />
      )}

      <div className="relative flex flex-col items-center">
        {/* Logo mark */}
        <span className="relative h-28 w-28 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-brass-light/40 sm:h-32 sm:w-32">
          <Image
            src="/grove-center-logo.jpg"
            alt="Historic Grove Center logo"
            fill
            sizes="128px"
            className="object-cover"
            priority
          />
        </span>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-brass-light">
          {site.city} · Est. 1949
        </p>

        <h1 className="mt-5 font-serif text-5xl font-semibold tracking-tight sm:text-7xl">
          {site.fullName}
        </h1>

        <div className="rule-brass mx-auto mt-8" />

        <p className="mt-8 max-w-md text-lg leading-relaxed text-background/85">
          A new home for Oak Ridge&apos;s original neighborhood shopping center
          is on the way. Our merchants and events — all in one place, very soon.
        </p>

        <p className="mt-10 text-sm uppercase tracking-[0.2em] text-brass-light">
          Coming Soon
        </p>

        <p className="mt-8 text-sm text-background/70">
          Questions?{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-medium text-background underline decoration-brass-light/60 underline-offset-4 hover:decoration-background"
          >
            {site.email}
          </a>
        </p>
      </div>

      <p className="absolute bottom-6 text-xs uppercase tracking-[0.15em] text-background/50">
        {site.association}
      </p>
    </section>
  );
}
