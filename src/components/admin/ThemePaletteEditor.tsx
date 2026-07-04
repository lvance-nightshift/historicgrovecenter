"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  THEME_TOKENS,
  DEFAULT_PALETTE,
  contrastRatio,
  contrastVerdict,
  type Palette,
} from "@/lib/theme-shared";
import { updateThemePalette, renameTheme } from "@/app/admin/site/actions";

const GROUPS = ["Brand", "Surface", "Text"] as const;

function ContrastBadge({ palette, tokenKey }: { palette: Palette; tokenKey: string }) {
  const token = THEME_TOKENS.find((t) => t.key === tokenKey);
  if (!token?.pairWith) return null;
  const ratio = contrastRatio(palette[tokenKey], palette[token.pairWith]);
  if (ratio == null) return null;
  const v = contrastVerdict(ratio);
  const color =
    v === "good" ? "text-grove" : v === "ok" ? "text-amber-600" : "text-brick-dark";
  const label = v === "good" ? "good" : v === "ok" ? "ok" : "low contrast";
  return (
    <span className={`text-[0.65rem] ${color}`} title={`Contrast vs ${token.pairWith}: ${ratio.toFixed(1)}:1`}>
      {ratio.toFixed(1)}:1 · {label}
    </span>
  );
}

export default function ThemePaletteEditor({
  themeId,
  name: initialName,
  palette: initialPalette,
}: {
  themeId: number;
  name: string;
  palette: Palette;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [palette, setPalette] = useState<Palette>(initialPalette);
  const [saved, setSaved] = useState(false);

  const set = (key: string, value: string) => {
    setPalette((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  // Inline CSS vars for the live preview scope.
  const previewVars = useMemo(() => {
    const o: Record<string, string> = {};
    for (const t of THEME_TOKENS) o[t.cssVar] = palette[t.key];
    return o as React.CSSProperties;
  }, [palette]);

  function save() {
    setSaved(false);
    startTransition(async () => {
      if (name !== initialName) await renameTheme(themeId, name);
      await updateThemePalette(themeId, palette);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Editor */}
      <div>
        <label className="block text-sm">
          <span className="font-medium text-foreground">Theme name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-grove"
          />
        </label>

        {GROUPS.map((group) => (
          <div key={group} className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {group}
            </h3>
            <div className="mt-2 space-y-2">
              {THEME_TOKENS.filter((t) => t.group === group).map((t) => (
                <div key={t.key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={palette[t.key]}
                    onChange={(e) => set(t.key, e.target.value)}
                    className="h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent"
                    aria-label={t.label}
                  />
                  <input
                    value={palette[t.key]}
                    onChange={(e) => set(t.key, e.target.value)}
                    className="w-24 rounded border border-border bg-background px-2 py-1 font-mono text-xs uppercase outline-none focus:border-grove"
                  />
                  <span className="flex-1 text-sm text-foreground">{t.label}</span>
                  <ContrastBadge palette={palette} tokenKey={t.key} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-full bg-grove px-5 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save theme"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPalette(DEFAULT_PALETTE);
              setSaved(false);
            }}
            className="text-sm text-muted hover:text-grove"
          >
            Reset to defaults
          </button>
          {saved && <span className="text-xs text-grove">Saved ✓ — live on the site</span>}
        </div>
      </div>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Live preview
        </h3>
        <div
          style={previewVars}
          className="overflow-hidden rounded-xl border"
        >
          <div style={{ background: "var(--grove)", color: "var(--background)" }} className="p-4">
            <p style={{ color: "var(--brass-light)" }} className="text-xs font-semibold uppercase tracking-widest">
              Oak Ridge · Est. 1949
            </p>
            <p className="mt-1 font-serif text-xl font-semibold">Grove Center</p>
            <div className="mt-3 flex gap-2">
              <span style={{ background: "var(--brass)", color: "var(--grove-dark)" }} className="rounded-full px-3 py-1 text-xs font-semibold">
                Primary
              </span>
              <span style={{ borderColor: "var(--background)", color: "var(--background)" }} className="rounded-full border px-3 py-1 text-xs font-semibold">
                Ghost
              </span>
            </div>
          </div>
          <div style={{ background: "var(--background)", color: "var(--foreground)" }} className="p-4">
            <div style={{ background: "var(--surface)", borderColor: "var(--border)" }} className="rounded-lg border p-3">
              <p className="font-serif font-semibold" style={{ color: "var(--grove)" }}>
                Merchant name
              </p>
              <p className="text-sm" style={{ color: "var(--brick-dark)" }}>Tagline in brick</p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Muted description text sits here for the card.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
