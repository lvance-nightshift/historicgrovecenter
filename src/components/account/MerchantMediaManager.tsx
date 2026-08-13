"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadFile } from "@/lib/media-client";
import {
  setMyCompanyLogo,
  addMyCompanyPhoto,
  removeMyCompanyPhoto,
} from "@/app/account/actions";

type MediaRef = { id: number; url: string };
const GALLERY_LIMIT = 3; // enforced server-side too

export default function MerchantMediaManager({
  companyId,
  initialLogo,
  initialGallery,
}: {
  companyId: number;
  initialLogo: MediaRef | null;
  initialGallery: MediaRef[];
}) {
  const [logo, setLogo] = useState<MediaRef | null>(initialLogo);
  const [gallery, setGallery] = useState<MediaRef[]>(initialGallery);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, startTransition] = useTransition();
  const logoInput = useRef<HTMLInputElement>(null);
  const galInput = useRef<HTMLInputElement>(null);

  async function onLogoFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const m = await uploadFile(file, "merchants");
      await setMyCompanyLogo(companyId, m.id);
      setLogo({ id: m.id, url: m.url });
    } catch {
      setError("Logo upload failed. Use a JPG/PNG under 25 MB.");
    } finally {
      setUploading(false);
    }
  }

  function removeLogo() {
    startTransition(async () => {
      await setMyCompanyLogo(companyId, null);
      setLogo(null);
    });
  }

  async function onGalleryFile(file: File) {
    setError(null);
    if (gallery.length >= GALLERY_LIMIT) {
      setError(`You can add up to ${GALLERY_LIMIT} photos.`);
      return;
    }
    setUploading(true);
    try {
      const m = await uploadFile(file, "merchants");
      await addMyCompanyPhoto(companyId, m.id);
      setGallery((g) => [...g, { id: m.id, url: m.url }]);
    } catch {
      setError("Photo upload failed. Use a JPG/PNG under 25 MB.");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(id: number) {
    startTransition(async () => {
      await removeMyCompanyPhoto(companyId, id);
      setGallery((g) => g.filter((p) => p.id !== id));
    });
  }

  return (
    <div className="space-y-5 rounded-xl border border-border bg-surface p-5">
      {/* Logo */}
      <div>
        <p className="text-sm font-medium text-foreground">Logo</p>
        <div className="mt-2 flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-background">
            {logo ? (
              <Image src={logo.url} alt="Logo" fill sizes="80px" className="object-contain" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs text-muted">
                No logo
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => logoInput.current?.click()}
              disabled={uploading || busy}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:border-grove/50 disabled:opacity-60"
            >
              {logo ? "Replace logo" : "Upload logo"}
            </button>
            {logo && (
              <button
                type="button"
                onClick={removeLogo}
                disabled={busy}
                className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-brick-dark"
              >
                Remove
              </button>
            )}
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onLogoFile(e.target.files[0])}
            />
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div>
        <p className="text-sm font-medium text-foreground">
          Photos <span className="text-muted">({gallery.length}/{GALLERY_LIMIT})</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {gallery.map((p) => (
            <div key={p.id} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
              <Image src={p.url} alt="" fill sizes="96px" className="object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                disabled={busy}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                title="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
          {gallery.length < GALLERY_LIMIT && (
            <button
              type="button"
              onClick={() => galInput.current?.click()}
              disabled={uploading || busy}
              className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-sm text-muted hover:border-grove/50 disabled:opacity-60"
            >
              <span className="text-xl">＋</span>
              Add
            </button>
          )}
          <input
            ref={galInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onGalleryFile(e.target.files[0])}
          />
        </div>
      </div>

      {uploading && <p className="text-xs text-muted">Uploading…</p>}
      {error && <p className="text-xs text-brick-dark">{error}</p>}
    </div>
  );
}
