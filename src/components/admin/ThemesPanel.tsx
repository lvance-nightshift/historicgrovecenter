"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createTheme,
  setDefaultTheme,
  deleteTheme,
  setThemeOverride,
} from "@/app/admin/site/actions";
import type { Palette } from "@/lib/theme-shared";

type ThemeRow = {
  id: number;
  name: string;
  isDefault: boolean;
  palette: Palette;
};

// Colors shown in the card's swatch strip.
const SWATCH_KEYS = [
  "grove",
  "groveDark",
  "brick",
  "brass",
  "brassLight",
  "background",
  "surface",
  "foreground",
];

export default function ThemesPanel({
  themes,
  activeName,
  activeSource,
  overrideId,
}: {
  themes: ThemeRow[];
  activeName: string;
  activeSource: string;
  overrideId: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");

  function create() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const id = await createTheme(name);
      setNewName("");
      router.push(`/admin/site/appearance/${id}`);
    });
  }

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="mt-8 space-y-6">
      {/* Active + override */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="text-muted">Active now: </span>
            <span className="font-semibold text-grove">{activeName}</span>
            <span className="ml-1 text-xs text-muted">({activeSource})</span>
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Force theme:</span>
            <select
              value={overrideId ?? ""}
              onChange={(e) =>
                run(() => setThemeOverride(e.target.value ? Number(e.target.value) : null))
              }
              disabled={pending}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-grove"
            >
              <option value="">None (auto)</option>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          &quot;Force theme&quot; overrides schedules and the default — use it to
          preview or run a one-off. Set back to &quot;None&quot; to return to
          automatic (schedule/default).
        </p>
      </div>

      {/* Themes as cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => (
          <div
            key={t.id}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
          >
            <Link href={`/admin/site/appearance/${t.id}`} className="block">
              {/* Swatch strip */}
              <div className="flex h-14">
                {SWATCH_KEYS.map((k) => (
                  <div key={k} className="flex-1" style={{ background: t.palette[k] }} />
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 px-4 pt-3">
                <span className="font-serif text-lg font-semibold text-foreground">
                  {t.name}
                </span>
                {t.isDefault && (
                  <span className="rounded-full bg-grove/10 px-2 py-0.5 text-[0.65rem] font-medium text-grove">
                    default
                  </span>
                )}
              </div>
            </Link>
            <div className="mt-2 flex items-center gap-4 px-4 pb-3 text-xs">
              <Link href={`/admin/site/appearance/${t.id}`} className="font-medium text-grove hover:underline">
                Edit colors
              </Link>
              {!t.isDefault && (
                <>
                  <button
                    type="button"
                    onClick={() => run(() => setDefaultTheme(t.id))}
                    disabled={pending}
                    className="text-muted hover:text-grove"
                  >
                    Make default
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete theme "${t.name}"?`)) run(() => deleteTheme(t.id));
                    }}
                    disabled={pending}
                    className="ml-auto text-brick-dark hover:underline"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create */}
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-4">
        <label className="text-sm">
          <span className="font-medium text-foreground">New theme</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="e.g. Autumn, Holiday, Pumpkin Fest"
            className="mt-1 block w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-grove"
          />
        </label>
        <button
          type="button"
          onClick={create}
          disabled={pending || !newName.trim()}
          className="rounded-full bg-grove px-4 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  );
}
