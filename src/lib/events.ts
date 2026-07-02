/*
 * Events & calendar data.
 *
 * PLACEHOLDER CONTENT — replace with real Grove Center events.
 * `date` is ISO (YYYY-MM-DD). Helpers below split upcoming vs. past
 * relative to today, so the calendar stays current automatically.
 */

export type GroveEvent = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // e.g. "6:00 PM"
  endTime?: string;
  location: string;
  category: EventCategory;
  summary: string;
  description: string;
};

export type EventCategory =
  | "Market"
  | "Live Music"
  | "Film"
  | "Family"
  | "Seasonal"
  | "Community";

export const events: GroveEvent[] = [
  {
    slug: "summer-night-market",
    title: "Summer Night Market",
    date: "2026-07-18",
    startTime: "5:00 PM",
    endTime: "9:00 PM",
    location: "Grove Center Courtyard",
    category: "Market",
    summary: "Local makers, food trucks, and live music under string lights.",
    description:
      "Dozens of Oak Ridge makers and growers fill the courtyard for an evening market. Grab dinner from rotating food trucks, shop handmade goods, and stay for the band.",
  },
  {
    slug: "grove-theater-classics",
    title: "Grove Theater Classics: Rear Window",
    date: "2026-07-25",
    startTime: "7:30 PM",
    location: "The Grove Theater",
    category: "Film",
    summary: "Hitchcock on the big screen in the restored 1949 theater.",
    description:
      "Our summer classic-film series continues with Alfred Hitchcock's Rear Window, projected in the historic Grove Theater. Concessions from the original snack bar.",
  },
  {
    slug: "first-friday-live",
    title: "First Friday Live",
    date: "2026-08-07",
    startTime: "6:00 PM",
    endTime: "9:00 PM",
    location: "Grove Center Courtyard",
    category: "Live Music",
    summary: "Regional bands, open shops, and late-evening strolling.",
    description:
      "Merchants stay open late and live bands take the courtyard stage the first Friday of every month. Free and family-friendly.",
  },
  {
    slug: "secret-city-history-walk",
    title: "Secret City History Walk",
    date: "2026-08-16",
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    location: "Meet at the Grove Theater marquee",
    category: "Community",
    summary: "A guided walking tour of Grove Center's Manhattan Project roots.",
    description:
      "Walk the center with a local historian and hear how Grove Center served the workers of the wartime Secret City. Free; donations support preservation.",
  },
  {
    slug: "harvest-festival",
    title: "Grove Harvest Festival",
    date: "2026-10-10",
    startTime: "11:00 AM",
    endTime: "5:00 PM",
    location: "Throughout Grove Center",
    category: "Seasonal",
    summary: "Fall market, kids' activities, and a chili cook-off.",
    description:
      "Our biggest day of the year: a fall market, hayrides, a merchant chili cook-off, live bluegrass, and pumpkins for the little ones.",
  },
  {
    slug: "holiday-tree-lighting",
    title: "Holiday Tree Lighting",
    date: "2026-11-27",
    startTime: "6:00 PM",
    location: "Grove Center Courtyard",
    category: "Seasonal",
    summary: "Kick off the season with carols, cocoa, and the big lights.",
    description:
      "Join us the evening after Thanksgiving as we light the courtyard tree, sing carols, and welcome the holiday season to Grove Center.",
  },
];

const parse = (d: string) => new Date(`${d}T00:00:00`);

/** Events today or later, soonest first. */
export function upcomingEvents(now: Date = new Date()): GroveEvent[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return events
    .filter((e) => parse(e.date) >= today)
    .sort((a, b) => parse(a.date).getTime() - parse(b.date).getTime());
}

/** Past events, most recent first. */
export function pastEvents(now: Date = new Date()): GroveEvent[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return events
    .filter((e) => parse(e.date) < today)
    .sort((a, b) => parse(b.date).getTime() - parse(a.date).getTime());
}

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
