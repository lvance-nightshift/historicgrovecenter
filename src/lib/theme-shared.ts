/*
 * Theme tokens + palette helpers, shared by server (injection) and client
 * (the palette editor). No server-only imports.
 *
 * Each token maps to a CSS custom property in globals.css. A "palette" is a
 * { tokenKey: "#hex" } map. `pairWith` names the token the editor checks
 * contrast against (e.g. text placed on this color) for readability hints.
 */

export type ThemeToken = {
  key: string;
  cssVar: string;
  label: string;
  group: "Brand" | "Surface" | "Text";
  default: string;
  pairWith?: string;
};

export const THEME_TOKENS: ThemeToken[] = [
  { key: "grove", cssVar: "--grove", label: "Grove green", group: "Brand", default: "#2f4a3c", pairWith: "background" },
  { key: "groveDark", cssVar: "--grove-dark", label: "Grove green — dark", group: "Brand", default: "#22382d", pairWith: "background" },
  { key: "groveLight", cssVar: "--grove-light", label: "Grove green — light", group: "Brand", default: "#7a9b86" },
  { key: "brick", cssVar: "--brick", label: "Brick / terracotta", group: "Brand", default: "#a8482f", pairWith: "background" },
  { key: "brickDark", cssVar: "--brick-dark", label: "Brick — dark", group: "Brand", default: "#8a3a25", pairWith: "background" },
  { key: "brass", cssVar: "--brass", label: "Brass gold", group: "Brand", default: "#c08a2d", pairWith: "groveDark" },
  { key: "brassLight", cssVar: "--brass-light", label: "Brass — light", group: "Brand", default: "#e0b968", pairWith: "groveDark" },
  { key: "background", cssVar: "--background", label: "Background", group: "Surface", default: "#f7f3ea", pairWith: "foreground" },
  { key: "surface", cssVar: "--surface", label: "Card surface", group: "Surface", default: "#fffdf8", pairWith: "foreground" },
  { key: "border", cssVar: "--border", label: "Border", group: "Surface", default: "#e4dcc9" },
  { key: "foreground", cssVar: "--foreground", label: "Text (ink)", group: "Text", default: "#24211b", pairWith: "background" },
  { key: "muted", cssVar: "--muted", label: "Muted text", group: "Text", default: "#6b6558", pairWith: "background" },
];

export type Palette = Record<string, string>;

export const DEFAULT_PALETTE: Palette = Object.fromEntries(
  THEME_TOKENS.map((t) => [t.key, t.default]),
);

/** Fill in any missing tokens from the defaults; ignore non-string values. */
export function normalizePalette(p: unknown): Palette {
  const out: Palette = { ...DEFAULT_PALETTE };
  if (p && typeof p === "object") {
    for (const key of Object.keys(DEFAULT_PALETTE)) {
      const v = (p as Record<string, unknown>)[key];
      if (typeof v === "string") out[key] = v;
    }
  }
  return out;
}

/** Palette → CSS variable declarations for a :root override. */
export function paletteToCssVars(p: Palette): string {
  return THEME_TOKENS.map((t) => `${t.cssVar}:${p[t.key] ?? t.default}`).join(";");
}

/* -------- Contrast (WCAG) -------- */

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio (1–21) between two hex colors, or null if unparseable. */
export function contrastRatio(a: string, b: string): number | null {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const la = relLuminance(ra);
  const lb = relLuminance(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastVerdict = "good" | "ok" | "low";

export function contrastVerdict(ratio: number): ContrastVerdict {
  if (ratio >= 4.5) return "good";
  if (ratio >= 3) return "ok";
  return "low";
}
