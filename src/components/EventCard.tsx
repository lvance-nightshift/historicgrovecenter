import { formatEventDate, type GroveEvent } from "@/lib/events";

export default function EventCard({ event }: { event: GroveEvent }) {
  const d = formatEventDate(event.date);

  return (
    <article className="flex gap-5 rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
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
            {event.category}
          </span>
          {(event.startTime || event.endTime) && (
            <span className="text-xs text-muted">
              {event.startTime}
              {event.endTime ? `–${event.endTime}` : ""}
            </span>
          )}
        </div>
        <h3 className="mt-2 font-serif text-lg font-semibold text-grove">
          {event.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{event.summary}</p>
        <p className="mt-2 text-xs font-medium text-foreground/70">
          📍 {event.location}
        </p>
      </div>
    </article>
  );
}
