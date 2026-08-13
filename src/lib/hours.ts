/*
 * Structured weekly hours (client-safe).
 *
 * Stored on companies.hours_by_day as a { mon: DayHours, … } map. A day is
 * either closed or has open/close "HH:MM" (24h) times. `companies.hours`
 * remains as an optional freeform note (holidays, "by appointment", etc.).
 */

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayHours = { closed: true } | { closed?: false; open: string; close: string };

export type WeekHours = Partial<Record<DayKey, DayHours>>;

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
];

/** Coerce unknown JSON into a WeekHours (defensive — bad data → {}). */
export function normalizeWeekHours(raw: unknown): WeekHours {
  if (!raw || typeof raw !== "object") return {};
  const out: WeekHours = {};
  for (const { key } of DAYS) {
    const d = (raw as Record<string, unknown>)[key];
    if (!d || typeof d !== "object") continue;
    const rec = d as Record<string, unknown>;
    if (rec.closed === true) out[key] = { closed: true };
    else if (typeof rec.open === "string" && typeof rec.close === "string") {
      out[key] = { closed: false, open: rec.open, close: rec.close };
    }
  }
  return out;
}

/** True if any day has been configured. */
export function hasWeekHours(w: WeekHours): boolean {
  return DAYS.some(({ key }) => w[key] != null);
}

/** "09:00" → "9:00 AM". Returns the input unchanged if unparseable. */
export function formatTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return hhmm;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}

/**
 * Human string for one day, e.g. "9:00 AM – 5:00 PM" or "Closed".
 * A day with no open hours (unset or explicitly closed) reads "Closed" — on a
 * public weekly table, a blank day means the shop is closed that day.
 */
export function formatDay(d: DayHours | undefined): string {
  if (!d || d.closed) return "Closed";
  return `${formatTime(d.open)} – ${formatTime(d.close)}`;
}
