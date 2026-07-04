"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  updateMediaMeta,
  addMediaTag,
  removeMediaTag,
} from "@/app/admin/actions";
import type { UploadedMedia, MediaTagRef } from "@/lib/media-client";

const input =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

export default function MediaEditor({ media }: { media: UploadedMedia }) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(media.title ?? "");
  const [altText, setAltText] = useState(media.altText ?? "");
  const [credit, setCredit] = useState(media.credit ?? "");
  const [tags, setTags] = useState<MediaTagRef[]>(media.tags ?? []);
  const [newTag, setNewTag] = useState("");
  const [saved, setSaved] = useState(false);

  // Re-seed when a different item is selected.
  useEffect(() => {
    setTitle(media.title ?? "");
    setAltText(media.altText ?? "");
    setCredit(media.credit ?? "");
    setTags(media.tags ?? []);
    setSaved(false);
  }, [media.id, media.title, media.altText, media.credit, media.tags]);

  const isImage =
    media.contentType?.startsWith("image/") &&
    media.contentType !== "application/pdf";

  function saveMeta() {
    setSaved(false);
    startTransition(async () => {
      await updateMediaMeta(media.id, { title, altText, credit });
      setSaved(true);
    });
  }

  function addTag() {
    const name = newTag.trim();
    if (!name) return;
    setNewTag("");
    startTransition(async () => {
      const tag = await addMediaTag(media.id, name);
      if (tag && !tags.some((t) => t.id === tag.id)) setTags((ts) => [...ts, tag]);
    });
  }

  function dropTag(tagId: number) {
    startTransition(async () => {
      await removeMediaTag(media.id, tagId);
      setTags((ts) => ts.filter((t) => t.id !== tagId));
    });
  }

  return (
    <div className="space-y-4 text-sm">
      {isImage ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
          <Image src={media.url} alt={media.altText ?? ""} fill sizes="320px" className="object-contain" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-grove/5 py-8 text-center text-muted">
          📄 {media.filename}
        </div>
      )}

      <p className="truncate text-xs text-muted">
        {media.filename}
        {media.width && media.height ? ` · ${media.width}×${media.height}` : ""}
      </p>

      <label className="block text-xs">
        <span className="font-medium text-foreground">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
      </label>
      <label className="block text-xs">
        <span className="font-medium text-foreground">Alt text</span>
        <input
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Describe the image (accessibility)"
          className={input}
        />
      </label>
      <label className="block text-xs">
        <span className="font-medium text-foreground">Credit</span>
        <input
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          placeholder="e.g. Photo by Ed Westcott / U.S. Dept. of Energy"
          className={input}
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={saveMeta}
          disabled={pending}
          className="rounded-full bg-grove px-4 py-1.5 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60"
        >
          Save
        </button>
        {saved && <span className="text-xs text-grove">Saved ✓</span>}
      </div>

      {/* Tags */}
      <div className="border-t border-border pt-4">
        <span className="text-xs font-medium text-foreground">Tags</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.length === 0 && <span className="text-xs text-muted">No tags yet.</span>}
          {tags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full bg-grove/10 px-2 py-0.5 text-xs text-grove"
            >
              {t.name}
              <button
                type="button"
                onClick={() => dropTag(t.id)}
                className="text-grove/60 hover:text-brick-dark"
                aria-label={`Remove ${t.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag…"
            className={input}
          />
          <button
            type="button"
            onClick={addTag}
            disabled={pending || !newTag.trim()}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:border-grove/50 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
