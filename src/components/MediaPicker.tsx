"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  uploadFile,
  fetchMedia,
  ACCEPTED_TYPES,
  type UploadedMedia,
} from "@/lib/media-client";

type UploadRow = { name: string; progress: number; error?: string };

export default function MediaPicker({
  collection = "general",
  onSelect,
  selectedId: controlledSelectedId,
}: {
  collection?: string;
  onSelect?: (media: UploadedMedia) => void;
  selectedId?: number | null;
}) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [items, setItems] = useState<UploadedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(
    controlledSelectedId ?? null,
  );
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchMedia(collection === "general" ? undefined : collection));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    load();
  }, [load]);

  const select = useCallback(
    (m: UploadedMedia) => {
      setSelectedId(m.id);
      onSelect?.(m);
    },
    [onSelect],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const accepted = Array.from(files).filter((f) =>
        (ACCEPTED_TYPES as readonly string[]).includes(f.type),
      );
      if (accepted.length === 0) {
        setError("Unsupported file type. Use an image or PDF.");
        return;
      }
      setError(null);
      for (const file of accepted) {
        const row: UploadRow = { name: file.name, progress: 0 };
        setUploads((u) => [...u, row]);
        const update = (patch: Partial<UploadRow>) =>
          setUploads((u) =>
            u.map((r) => (r === row ? { ...r, ...patch } : r)),
          );
        try {
          const media = await uploadFile(file, collection, (f) =>
            update({ progress: f }),
          );
          update({ progress: 1 });
          setItems((prev) => [media, ...prev]);
          select(media);
          setUploads((u) => u.filter((r) => r !== row));
        } catch (e) {
          update({ error: e instanceof Error ? e.message : "Upload failed" });
        }
      }
      setTab("library");
    },
    [collection, select],
  );

  const isImage = (m: UploadedMedia) =>
    m.contentType?.startsWith("image/") && m.contentType !== "application/pdf";

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border p-2">
        {(["library", "upload"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-grove text-background"
                : "text-foreground/70 hover:bg-grove/10"
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto pr-1 text-xs uppercase tracking-wide text-muted">
          {collection}
        </span>
      </div>

      {error && (
        <p className="mx-3 mt-3 rounded-md bg-brick/10 px-3 py-2 text-sm text-brick-dark">
          {error}
        </p>
      )}

      {tab === "upload" && (
        <div className="p-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
              dragOver
                ? "border-grove bg-grove/5"
                : "border-border hover:border-grove/50"
            }`}
          >
            <p className="font-medium text-foreground">
              Drop files here, or click to choose
            </p>
            <p className="mt-1 text-xs text-muted">
              Images or PDF · up to 25 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {uploads.length > 0 && (
            <ul className="mt-4 space-y-2">
              {uploads.map((u, i) => (
                <li key={i} className="text-sm">
                  <div className="flex justify-between">
                    <span className="truncate">{u.name}</span>
                    <span className="text-muted">
                      {u.error ? "failed" : `${Math.round(u.progress * 100)}%`}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full ${u.error ? "bg-brick" : "bg-grove"}`}
                      style={{ width: `${Math.round(u.progress * 100)}%` }}
                    />
                  </div>
                  {u.error && (
                    <span className="text-xs text-brick-dark">{u.error}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "library" && (
        <div className="p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No media yet. Switch to Upload to add some.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => select(m)}
                  title={m.filename ?? undefined}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedId === m.id
                      ? "border-grove ring-2 ring-grove/30"
                      : "border-border hover:border-grove/50"
                  }`}
                >
                  {isImage(m) ? (
                    <Image
                      src={m.url}
                      alt={m.altText ?? m.filename ?? ""}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center bg-grove/5 text-xs text-muted">
                      <span className="text-2xl">📄</span>
                      PDF
                    </span>
                  )}
                  {selectedId === m.id && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-grove text-xs text-background">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
