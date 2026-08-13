import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventRegistrationTabs from "@/components/EventRegistrationTabs";
import { getRegisterableEvent } from "@/lib/events-db";

export const dynamic = "force-dynamic";

const etDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const etTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  minute: "2-digit",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getRegisterableEvent(slug);
  if (!event) return { title: "Vendor registration" };
  return {
    title: `${event.title} — Vendor Registration`,
    description: `Register as a vendor for ${event.title} at the Historic Grove Center in Oak Ridge, TN.`,
  };
}

export default async function EventRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getRegisterableEvent(slug);
  if (!event) notFound();

  const start = event.startAt ? new Date(event.startAt) : null;
  const dateLabel = start ? etDate.format(start) : null;
  const timeLabel = start ? etTime.format(start) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-grove text-background">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brass-light">
            Vendor registration
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {event.title}
          </h1>
          {(dateLabel || event.location) && (
            <p className="mt-3 text-background/85">
              {dateLabel}
              {dateLabel && timeLabel ? ` · ${timeLabel}` : ""}
              {event.location ? ` · ${event.location}` : ""}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {event.description && (
          <p className="mb-8 whitespace-pre-line text-foreground/80">
            {event.description}
          </p>
        )}

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-grove">
            Reserve your space
          </h2>
          <p className="mt-1 text-sm text-muted">
            Fill this out and someone from the Grove Center will follow up to
            confirm your spot.
          </p>
          <div className="mt-6">
            <EventRegistrationTabs
              eventSlug={event.slug}
              vendorOpen={event.vendorAppsOpen}
              foodOpen={event.foodAppsOpen}
            />
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/events" className="text-grove hover:underline">
            ← Back to all events
          </Link>
        </p>
      </main>
    </div>
  );
}
