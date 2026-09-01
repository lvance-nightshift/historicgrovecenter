"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MediaPicker from "@/components/MediaPicker";
import { setEventHero } from "@/app/admin/events-actions";
import type { UploadedMedia } from "@/lib/media-client";

/** Attach (or clear) an event's graphic. Only for events that already exist. */
export default function EventImageManager({
  eventId,
  currentUrl,
}: {
  eventId: number;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<UploadedMedia | null>(null);
  const [open, setOpen] = useState(false);

  function save(mediaId: number | null) {
    startTransition(async () => {
      await setEventHero(eventId, mediaId);
      setPicked(null);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">Event graphic</span>
        <div className="flex items-center gap-3 text-xs">
          {currentUrl && (
            <button
              type="button"
              onClick={() => save(null)}
              disabled={pending}
              className="text-brick-dark hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="font-medium text-grove hover:underline"
          >
            {open ? "Close" : currentUrl ? "Replace" : "Add image"}
          </button>
        </div>
      </div>

      {currentUrl && !open && (
        <div className="relative mt-3 aspect-[16/9] max-w-sm overflow-hidden rounded-lg border border-border">
          <Image src={currentUrl} alt="" fill sizes="384px" className="object-cover" />
        </div>
      )}

      {open && (
        <div className="mt-3">
          <p className="text-xs text-muted">
            Upload a graphic or pick one from the library. Landscape images look best on the event page.
          </p>
          <div className="mt-2">
            <MediaPicker collection="events" onSelect={setPicked} selectedId={picked?.id ?? null} />
          </div>
          <button
            type="button"
            onClick={() => picked && save(picked.id)}
            disabled={!picked || pending}
            className="mt-3 rounded-full bg-grove px-5 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-50"
          >
            {pending ? "Saving…" : "Use this image"}
          </button>
        </div>
      )}
    </div>
  );
}
