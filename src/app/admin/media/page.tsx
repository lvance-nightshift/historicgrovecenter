"use client";

import { useState } from "react";
import MediaPicker from "@/components/MediaPicker";
import MediaEditor from "@/components/admin/MediaEditor";
import { MEDIA_COLLECTIONS } from "@/lib/media-shared";
import type { UploadedMedia } from "@/lib/media-client";

export default function AdminMediaPage() {
  const [collection, setCollection] = useState<string>("general");
  const [selected, setSelected] = useState<UploadedMedia | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-grove">
          Media Library
        </h1>
        <p className="mt-1 text-sm text-muted">
          Upload and manage images and documents for the site, merchants, and events.
        </p>
      </div>

      {/* Collection selector */}
      <div className="mt-8 flex flex-wrap gap-2">
        {MEDIA_COLLECTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCollection(c);
              setSelected(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              collection === c
                ? "bg-grove text-background"
                : "border border-border bg-surface text-foreground/80 hover:border-grove/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        {/* keyed by collection so it reloads when the tab changes */}
        <MediaPicker
          key={collection}
          collection={collection}
          onSelect={setSelected}
          selectedId={selected?.id ?? null}
        />

        {/* Editor for the selected item — title, alt, credit, tags */}
        <aside className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Details &amp; credit
          </h2>
          {selected ? (
            <MediaEditor key={selected.id} media={selected} />
          ) : (
            <p className="text-sm text-muted">
              Pick an item to edit its title, alt text, credit, and tags.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
