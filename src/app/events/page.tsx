import type { Metadata } from "next";
import EventCard from "@/components/EventCard";
import PageHero from "@/components/PageHero";
import { pastEvents, upcomingEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Night markets, film nights, seasonal festivals, and history walks at Historic Grove Center in Oak Ridge, Tennessee.",
};

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const past = pastEvents();

  return (
    <>
      <PageHero
        eyebrow="Calendar"
        title="Events at the Center"
        subtitle="There's almost always something happening in the courtyard. Here's what's on."
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl font-semibold text-grove">
          Upcoming
        </h2>
        <div className="rule-brass mt-3" />

        {upcoming.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {upcoming.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-lg border border-border bg-surface p-6 text-muted">
            No upcoming events are posted right now. Follow us on social media or
            check back soon for the next season&apos;s lineup.
          </p>
        )}

        {past.length > 0 && (
          <>
            <h2 className="mt-16 font-serif text-2xl font-semibold text-grove">
              Recently at the Grove
            </h2>
            <div className="rule-brass mt-3" />
            <div className="mt-8 grid gap-6 opacity-80 sm:grid-cols-2">
              {past.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Host / submit CTA */}
      <section className="bg-surface/60">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-serif text-2xl font-semibold text-grove">
            Want to host an event at Grove Center?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-muted">
            Merchants and community groups can bring markets, performances, and
            gatherings to the courtyard. Reach out to the Association to get on
            the calendar.
          </p>
          <a
            href="/visit"
            className="mt-6 inline-block rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark"
          >
            Contact the Association
          </a>
        </div>
      </section>
    </>
  );
}
