"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MediaPicker from "@/components/MediaPicker";
import { setHomeHero } from "@/app/admin/actions";
import type { UploadedMedia } from "@/lib/media-client";

export default function HeroManager({
  current,
}: {
  current: { id: number; url: string; filename: string | null } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<UploadedMedia | null>(null);
  const [saved, setSaved] = useState(false);

  function save(mediaId: number | null) {
    setSaved(false);
    startTransition(async () => {
      await setHomeHero(mediaId);
      setSaved(true);
      setPicked(null);
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Current hero */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Current hero
          </h3>
          {current && (
            <button
              type="button"
              onClick={() => save(null)}
              disabled={pending}
              className="text-xs text-brick-dark hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
        {current ? (
          <div className="relative mt-3 aspect-[16/6] overflow-hidden rounded-lg border border-border">
            <Image src={current.url} alt="" fill sizes="900px" className="object-cover" />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No hero set — the home page shows the default green treatment.
          </p>
        )}
        {saved && <p className="mt-2 text-xs text-grove">Saved ✓</p>}
      </div>

      {/* Pick a new one */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Choose a new hero
        </h3>
        <p className="mt-1 text-xs text-muted">
          Landscape images work best. Upload here or pick from the site library.
        </p>
        <div className="mt-3">
          <MediaPicker
            collection="site"
            onSelect={setPicked}
            selectedId={picked?.id ?? null}
          />
        </div>
        <button
          type="button"
          onClick={() => picked && save(picked.id)}
          disabled={!picked || pending}
          className="mt-4 rounded-full bg-grove px-5 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-50"
        >
          {pending ? "Setting…" : "Set as home hero"}
        </button>
      </div>
    </div>
  );
}
