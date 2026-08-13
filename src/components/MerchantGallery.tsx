"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

/*
 * Merchant photo strip + full-screen lightbox. Thumbnails render as a compact
 * strip (in the sidebar, below the contact card); clicking one opens a
 * full-screen viewer with a filmstrip and keyboard / arrow navigation.
 */
export default function MerchantGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const has = images.length > 0;

  const close = useCallback(() => setOpen(null), []);
  const go = useCallback(
    (dir: number) =>
      setOpen((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, go]);

  if (!has) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        Photos
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            className="relative aspect-square overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90"
            aria-label={`Enlarge photo ${i + 1}`}
          >
            <Image src={url} alt={`${name} photo ${i + 1}`} fill sizes="90px" className="object-cover" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          {/* Close */}
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
            aria-label="Close"
          >
            ×
          </button>

          {/* Main image + arrows */}
          <div className="flex flex-1 items-center justify-center gap-2 px-2 sm:gap-4">
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
                aria-label="Previous"
              >
                ‹
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[open]}
              alt={`${name} photo ${open + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[78vh] max-w-[86vw] rounded-lg object-contain"
            />
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
                aria-label="Next"
              >
                ›
              </button>
            )}
          </div>

          {/* Filmstrip */}
          {images.length > 1 && (
            <div
              className="flex justify-center gap-2 overflow-x-auto p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpen(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                    i === open ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Photo ${i + 1}`}
                >
                  <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
