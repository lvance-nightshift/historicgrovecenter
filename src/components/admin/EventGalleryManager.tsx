"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MediaPicker from "@/components/MediaPicker";
import {
  addEventGalleryImage,
  removeEventGalleryImage,
} from "@/app/admin/events-actions";
import type { EventGalleryImage } from "@/lib/events-db";
import type { UploadedMedia } from "@/lib/media-client";

/**
 * Manage an event's gallery — extra images shown on the public event page,
 * below the main graphic. Only for events that already exist.
 */
export default function EventGalleryManager({
  eventId,
  initial,
}: {
  eventId: number;
  initial: EventGalleryImage[];
}) {
  const router = useRouter();
  const [list, setList] = useState<EventGalleryImage[]>(initial);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function add(m: UploadedMedia) {
    setMsg(null);
    startTransition(async () => {
      try {
        const next = await addEventGalleryImage(eventId, m.id);
        setList(next);
        setMsg("Image added ✓");
        setOpen(false);
        router.refresh();
      } catch {
        setMsg("Could not add the image. Please try again.");
      }
    });
  }

  function remove(attachmentId: number) {
    setMsg(null);
    startTransition(async () => {
      try {
        const next = await removeEventGalleryImage(eventId, attachmentId);
        setList(next);
        router.refresh();
      } catch {
        setMsg("Could not remove the image. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">
          More images <span className="text-muted">({list.length})</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-medium text-grove hover:underline"
        >
          {open ? "Close" : "+ Add image"}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">
        Extra graphics (e.g. a flyer or schedule) shown full-width on the event page, below the
        main graphic.
      </p>

      {list.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((img) => (
            <li
              key={img.attachmentId}
              className="relative overflow-hidden rounded-lg border border-border bg-white"
            >
              <Image
                src={img.url}
                alt={img.alt ?? ""}
                width={img.width ?? 400}
                height={img.height ?? 225}
                className="h-24 w-full object-contain"
              />
              <button
                type="button"
                onClick={() => remove(img.attachmentId)}
                disabled={pending}
                className="absolute right-1 top-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-brick-dark shadow-sm hover:bg-background disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-3">
          <p className="text-xs text-muted">
            Upload a graphic (or pick one from the library) — click it to add it to this event.
          </p>
          <div className="mt-2">
            <MediaPicker collection="events" onSelect={add} />
          </div>
        </div>
      )}

      {msg && <p className="mt-2 text-xs font-medium text-grove">{msg}</p>}
      {pending && <p className="mt-2 text-xs text-muted">Saving…</p>}
    </div>
  );
}
