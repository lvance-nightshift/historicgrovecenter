"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MediaPicker from "@/components/MediaPicker";
import { setEventSponsors } from "@/app/admin/events-actions";
import type { Sponsor } from "@/lib/sponsors";
import type { UploadedMedia } from "@/lib/media-client";

/** Manage an event's "Our Sponsors" wall. Only for events that already exist. */
export default function EventSponsorsManager({
  eventId,
  initial,
}: {
  eventId: number;
  initial: Sponsor[];
}) {
  const router = useRouter();
  const [list, setList] = useState<Sponsor[]>(initial);
  const [pending, startTransition] = useTransition();
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<Sponsor | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function persist(next: Sponsor[]) {
    setMsg(null);
    startTransition(async () => {
      try {
        await setEventSponsors(eventId, next);
        setList(next);
        setMsg("Sponsors saved ✓");
        router.refresh();
      } catch {
        setMsg("Could not save sponsors. Please try again.");
      }
    });
  }

  // Picked (or uploaded) a logo → open the little details form to name it.
  function onPick(m: UploadedMedia) {
    setDraft({
      name: m.title?.trim() || "",
      logoUrl: m.url,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      website: undefined,
      presenting: false,
    });
    setPicking(false);
  }

  function addDraft() {
    if (!draft || !draft.name.trim()) return;
    persist([...list, { ...draft, name: draft.name.trim() }]);
    setDraft(null);
  }

  function remove(i: number) {
    persist(list.filter((_, idx) => idx !== i));
  }

  function togglePresenting(i: number) {
    persist(list.map((s, idx) => (idx === i ? { ...s, presenting: !s.presenting } : s)));
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">
          Sponsors <span className="text-muted">({list.length})</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setPicking((v) => !v);
            setDraft(null);
          }}
          className="text-xs font-medium text-grove hover:underline"
        >
          {picking ? "Close" : "+ Add sponsor"}
        </button>
      </div>

      {list.length > 0 && (
        <ul className="mt-3 space-y-2">
          {list.map((s, i) => (
            <li
              key={`${s.logoUrl}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2"
            >
              <Image
                src={s.logoUrl}
                alt={s.name}
                width={s.width ?? 120}
                height={s.height ?? 60}
                className="h-8 w-auto max-w-[120px] object-contain"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {s.name}
                {s.presenting && (
                  <span className="ml-2 rounded-full bg-brick/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-brick-dark">
                    Presenting
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => togglePresenting(i)}
                disabled={pending}
                className="shrink-0 text-xs text-grove hover:underline disabled:opacity-50"
              >
                {s.presenting ? "Unset presenting" : "Make presenting"}
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={pending}
                className="shrink-0 text-xs text-brick-dark hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-3 space-y-2 rounded-lg border border-grove/30 bg-surface p-3">
          <div className="flex items-center gap-3">
            <Image
              src={draft.logoUrl}
              alt=""
              width={draft.width ?? 120}
              height={draft.height ?? 60}
              className="h-10 w-auto max-w-[140px] rounded border border-border bg-white object-contain p-1"
            />
            <span className="text-xs text-muted">New sponsor logo</span>
          </div>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Sponsor name (e.g. Biloski & Miller)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20"
          />
          <input
            value={draft.website ?? ""}
            onChange={(e) => setDraft({ ...draft, website: e.target.value })}
            placeholder="Website (optional) — https://…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.presenting ?? false}
              onChange={(e) => setDraft({ ...draft, presenting: e.target.checked })}
            />
            <span className="text-foreground/80">Presenting sponsor (shown larger)</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addDraft}
              disabled={pending || !draft.name.trim()}
              className="rounded-full bg-grove px-4 py-1.5 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-50"
            >
              Add sponsor
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {picking && !draft && (
        <div className="mt-3">
          <p className="text-xs text-muted">
            Upload a sponsor logo (or pick one from the library) — click it, then give it a name.
            A transparent PNG looks best.
          </p>
          <div className="mt-2">
            <MediaPicker collection="site" onSelect={onPick} />
          </div>
        </div>
      )}

      {msg && <p className="mt-2 text-xs font-medium text-grove">{msg}</p>}
      {pending && <p className="mt-2 text-xs text-muted">Saving…</p>}
    </div>
  );
}
