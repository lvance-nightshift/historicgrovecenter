import Link from "next/link";
import { formatEventDate, type PublicEvent } from "@/lib/events";

export default function EventCard({ event }: { event: PublicEvent }) {
  const d = formatEventDate(event.date);

  return (
    <article className="relative flex gap-5 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-grove/40 hover:shadow-md">
      {/* Date block */}
      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-grove text-background">
        <span className="text-xs font-semibold uppercase tracking-wider text-brass-light">
          {d.month}
        </span>
        <span className="font-serif text-3xl font-semibold leading-none">
          {d.day}
        </span>
        <span className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-background/70">
          {d.weekday}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brick/10 px-2.5 py-0.5 text-xs font-medium text-brick-dark">
            {event.badge}
          </span>
          {(event.startTime || event.endTime) && (
            <span className="text-xs text-muted">
              {event.startTime}
              {event.endTime ? `–${event.endTime}` : ""}
            </span>
          )}
        </div>
        {/* Title link stretches over the whole card (via ::after) so the card is
            clickable; the action buttons below sit above it with z-10. */}
        <h3 className="mt-2 font-serif text-lg font-semibold text-grove">
          <Link
            href={`/events/${event.slug}`}
            className="transition-colors after:absolute after:inset-0 hover:text-grove-dark"
          >
            {event.title}
          </Link>
        </h3>
        {event.summary && (
          <p className="mt-1 text-sm text-muted">{event.summary}</p>
        )}
        <p className="mt-2 text-xs font-medium text-foreground/70">
          📍 {event.location}
        </p>
        {(event.ticketUrl || event.registerUrl) && (
          <div className="relative z-10 mt-3 flex flex-wrap gap-2">
            {event.ticketUrl &&
              (event.ticketUrl.startsWith("/") ? (
                <Link
                  href={event.ticketUrl}
                  className="inline-block rounded-full bg-grove px-4 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-grove-dark"
                >
                  Register →
                </Link>
              ) : (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-grove px-4 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-grove-dark"
                >
                  Get tickets ↗
                </a>
              ))}
            {event.registerUrl && (
              <Link
                href={event.registerUrl}
                className="inline-block rounded-full border border-grove/50 px-4 py-1.5 text-xs font-semibold text-grove transition-colors hover:bg-grove/10"
              >
                Become a vendor →
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
