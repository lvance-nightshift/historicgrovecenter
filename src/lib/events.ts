/*
 * Public events — shared types + date formatting (client-safe).
 *
 * The data now lives in the database (the `events` table). Server code fetches
 * it via src/lib/events-db.ts (getPublicEvents); this module only holds the
 * shape the calendar UI renders and a date helper.
 */

export type PublicEvent = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD (Eastern)
  startTime?: string; // e.g. "6:00 PM"
  endTime?: string;
  location: string;
  badge: string; // category-like label (business name, or "Grove Center")
  summary: string;
  ticketUrl?: string; // external tickets/RSVP link
};

const parse = (d: string) => new Date(`${d}T00:00:00`);

export function formatEventDate(iso: string): {
  weekday: string;
  month: string;
  day: string;
  year: string;
  full: string;
} {
  const d = parse(iso);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    year: d.toLocaleDateString("en-US", { year: "numeric" }),
    full: d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}
