import type { Metadata } from "next";
import Image from "next/image";
import { PUMPKIN_FEST as PF } from "@/lib/pumpkin-fest";
import VendorRegistrationForm from "@/components/VendorRegistrationForm";

export const metadata: Metadata = {
  title: "Fall Pumpkin Fest — Vendor Registration",
  description:
    "Reserve a vendor space at the Historic Grove Center Fall Pumpkin Fest, Saturday October 17, 2026 in Oak Ridge, TN. Music, pumpkins, a petting zoo, and a pet costume contest benefiting SARG and the Historic Grove Theater.",
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export default function PumpkinFestPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero / banner */}
      <header className="relative overflow-hidden bg-grove px-6 py-12 text-center text-background">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-conic-gradient(from 0deg at 50% 20%, var(--brass-light) 0deg 6deg, transparent 6deg 18deg)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
          <span className="relative h-24 w-24 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-brass-light/40">
            <Image
              src="/grove-center-logo.jpg"
              alt="Historic Grove Center logo"
              fill
              sizes="96px"
              className="object-cover"
              priority
            />
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-brass-light">
            {PF.familyTag}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-6xl">
            Fall Pumpkin Fest
          </h1>
          <p className="mt-3 text-lg font-medium text-brass-light">{PF.motto}</p>
          <p className="mt-5 text-base text-background/90">
            {PF.dateLabel} · {PF.hoursLabel}
          </p>
          <p className="text-sm text-background/75">{PF.location}</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_26rem]">
          {/* Left: about + details */}
          <section>
            <h2 className="font-serif text-2xl font-semibold text-grove">
              Become a vendor
            </h2>
            <p className="mt-3 text-foreground/85">{PF.intro}</p>
            <p className="mt-3 text-foreground/85">{PF.benefitBlurb}</p>

            <ul className="mt-5 space-y-2">
              {PF.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-foreground/85">
                  <span aria-hidden className="text-brick">🎃</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-border bg-surface p-5">
              <h3 className="font-serif text-lg font-semibold text-grove">
                Event details
              </h3>
              <dl className="mt-2">
                <DetailRow label="Date">{PF.dateLabel}</DetailRow>
                <DetailRow label="Festival hours">{PF.hoursLabel}</DetailRow>
                <DetailRow label="Vendor setup">
                  {PF.setupLabel} · {PF.streetClosedLabel}
                </DetailRow>
                <DetailRow label="Location">{PF.location}</DetailRow>
                <DetailRow label="Vendor spots">{PF.spotsLabel}</DetailRow>
                <DetailRow label="Booth fee">{PF.boothFeeLabel}</DetailRow>
                <DetailRow label="Organizer">{PF.organizer}</DetailRow>
                <DetailRow label="Benefiting">{PF.benefiting}</DetailRow>
                <DetailRow label="Contact">
                  {PF.contact.name}
                  <br />
                  <a
                    className="text-grove underline decoration-brass-light/60 underline-offset-2 hover:text-grove-dark"
                    href={`mailto:${PF.contact.email}`}
                  >
                    {PF.contact.email}
                  </a>{" "}
                  · {PF.contact.phone}
                </DetailRow>
              </dl>
            </div>
          </section>

          {/* Right: registration form */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="font-serif text-xl font-semibold text-grove">
                Vendor registration
              </h2>
              <p className="mt-1 text-sm text-muted">
                Reserve your space — spots are limited and first come, first
                served.
              </p>
              <div className="mt-5">
                <VendorRegistrationForm />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        Historic Grove Center · Friends of the Grove Theater · Oak Ridge, TN
      </footer>
    </div>
  );
}
