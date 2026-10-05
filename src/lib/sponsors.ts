/*
 * Event sponsors — the "Our Sponsors" wall shown on an event's public page.
 *
 * Stored as a jsonb array on events.sponsors (see schema). Kept client-safe
 * (no server-only imports) so the admin manager can share the type + parser.
 */

export type Sponsor = {
  name: string;
  logoUrl: string;
  width?: number;
  height?: number;
  website?: string;
  /** The headline sponsor — rendered larger, above the rest. */
  presenting?: boolean;
};

/** Coerce arbitrary jsonb into a clean, display-safe sponsor list. */
export function normalizeSponsors(raw: unknown): Sponsor[] {
  if (!Array.isArray(raw)) return [];
  const out: Sponsor[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const logoUrl = typeof o.logoUrl === "string" ? o.logoUrl.trim() : "";
    if (!name || !logoUrl) continue;
    const website =
      typeof o.website === "string" && o.website.trim() ? o.website.trim() : undefined;
    out.push({
      name,
      logoUrl,
      width: typeof o.width === "number" && o.width > 0 ? o.width : undefined,
      height: typeof o.height === "number" && o.height > 0 ? o.height : undefined,
      website,
      presenting: o.presenting === true,
    });
  }
  // Presenting sponsors first; otherwise preserve entry order.
  return out
    .map((s, i) => ({ s, i }))
    .sort((a, b) => Number(b.s.presenting) - Number(a.s.presenting) || a.i - b.i)
    .map(({ s }) => s);
}
