/*
 * Eastern-time <-> datetime-local helpers (client-safe).
 *
 * Events are Grove Center (Oak Ridge, TN) local time and are DISPLAYED in
 * Eastern everywhere. So the editor's <input type="datetime-local"> must be
 * interpreted as Eastern wall-clock too — not the editor's own timezone —
 * otherwise an admin on Pacific time enters "6:00 PM" and the public site
 * shows "9:00 PM". These helpers do the conversion without a TZ library.
 */

const TZ = "America/New_York";

/** Minutes Eastern is ahead of UTC at the given instant (EDT −240, EST −300). */
function etOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "0" : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - date.getTime()) / 60000;
}

/** ISO instant → "YYYY-MM-DDTHH:MM" as Eastern wall-clock (for datetime-local). */
export function isoToEtLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const shifted = new Date(d.getTime() + etOffsetMinutes(d) * 60000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${p(shifted.getUTCMonth() + 1)}-${p(shifted.getUTCDate())}T${p(shifted.getUTCHours())}:${p(shifted.getUTCMinutes())}`;
}

/** "YYYY-MM-DDTHH:MM" Eastern wall-clock → UTC ISO instant. */
export function etLocalInputToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local || "");
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const approxUTC = Date.UTC(y, mo - 1, d, h, mi);
  // Correct by the ET offset; recompute once to settle DST boundaries.
  const real1 = approxUTC - etOffsetMinutes(new Date(approxUTC)) * 60000;
  const real2 = approxUTC - etOffsetMinutes(new Date(real1)) * 60000;
  return new Date(real2).toISOString();
}
