"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth/client";
import MediaPicker from "@/components/MediaPicker";
import { MEDIA_COLLECTIONS } from "@/lib/media-shared";
import type { UploadedMedia } from "@/lib/media-client";

export default function AdminMediaPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [collection, setCollection] = useState<string>("general");
  const [selected, setSelected] = useState<UploadedMedia | null>(null);

  if (!isPending && !session) {
    router.replace("/auth/sign-in?returnTo=/admin/media");
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-grove">
            Media Library
          </h1>
          <p className="mt-1 text-sm text-muted">
            Upload and manage images and documents for the site, merchants, and events.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {session?.user?.email && (
            <span className="text-muted">{session.user.email}</span>
          )}
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              router.replace("/auth/sign-in");
            }}
            className="rounded-full border border-border px-4 py-1.5 font-medium text-foreground hover:border-grove/50"
          >
            Sign out
          </button>
        </div>
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

        {/* Selection preview — shows what onSelect returns */}
        <aside className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Selected
          </h2>
          {selected ? (
            <div className="mt-3 space-y-3 text-sm">
              {selected.contentType?.startsWith("image/") &&
              selected.contentType !== "application/pdf" ? (
                <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
                  <Image
                    src={selected.url}
                    alt={selected.altText ?? selected.filename ?? ""}
                    fill
                    sizes="288px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-grove/5 py-8 text-center text-muted">
                  📄 {selected.filename}
                </div>
              )}
              <dl className="space-y-1 text-xs text-muted">
                <div className="truncate">
                  <span className="font-medium text-foreground">File:</span>{" "}
                  {selected.filename}
                </div>
                <div>
                  <span className="font-medium text-foreground">Size:</span>{" "}
                  {selected.width && selected.height
                    ? `${selected.width}×${selected.height} · `
                    : ""}
                  {selected.sizeBytes
                    ? `${Math.round(selected.sizeBytes / 1024)} KB`
                    : ""}
                </div>
                <div className="break-all">
                  <span className="font-medium text-foreground">URL:</span>{" "}
                  <a href={selected.url} target="_blank" rel="noreferrer" className="text-grove hover:underline">
                    open
                  </a>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Pick an item to see its details here.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
