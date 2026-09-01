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
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function save(mediaId: number | null) {
    setMsg(null);
    startTransition(async () => {
      try {
        await setEventHero(eventId, mediaId);
        setMsg(mediaId ? "Image set ✓" : "Image removed");
        setOpen(false);
        router.refresh();
      } catch {
        setMsg("Could not save the image. Please try again.");
      }
    });
  }

  // Selecting (or uploading + clicking) an image applies it immediately.
  const onSelect = (m: UploadedMedia) => save(m.id);

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
            Upload a graphic (or pick one from the library) — <strong>click it and it's applied
            right away</strong>. Landscape images look best on the event page.
          </p>
          <div className="mt-2">
            <MediaPicker collection="events" onSelect={onSelect} />
          </div>
        </div>
      )}

      {msg && <p className="mt-2 text-xs font-medium text-grove">{msg}</p>}
      {pending && <p className="mt-2 text-xs text-muted">Saving…</p>}
    </div>
  );
}
