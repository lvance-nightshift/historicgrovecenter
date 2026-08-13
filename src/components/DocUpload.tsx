"use client";

import { useRef, useState } from "react";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB (server-side upload)

/*
 * Single-file uploader for a food vendor's permit / insurance doc. Uploads
 * through the server into the private docs bucket and exposes the resulting
 * object key via a hidden <input name={name}> so it submits with the form.
 *
 * initialKey  — pre-existing key (admin edit); preserved unless replaced/removed.
 * adminView   — show "View" (admin-gated link) + "Remove" controls.
 */
export default function DocUpload({
  name,
  label,
  initialKey = "",
  adminView = false,
}: {
  name: string;
  label: string;
  initialKey?: string;
  adminView?: boolean;
}) {
  const [objectKey, setObjectKey] = useState(initialKey);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    initialKey ? "done" : "idle",
  );
  const [fileName, setFileName] = useState(initialKey ? "current file" : "");
  const [msg, setMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setMsg(null);
    if (!ALLOWED.includes(file.type)) {
      setStatus("error");
      setMsg("Please use a PDF, JPG, or PNG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setMsg("File is too large (max 4 MB).");
      return;
    }
    setStatus("uploading");
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/pumpkin-fest/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const { key } = await res.json();
      setObjectKey(key);
      setStatus("done");
    } catch {
      setStatus("error");
      setMsg("Upload failed. Please try again.");
    }
  }

  function remove() {
    setObjectKey("");
    setStatus("idle");
    setFileName("");
  }

  return (
    <div className="text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input type="hidden" name={name} value={objectKey} />
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "uploading"}
          className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground hover:border-grove/50 disabled:opacity-60"
        >
          {status === "done" ? "Replace file" : "Choose file"}
        </button>
        {status === "uploading" && <span className="text-xs text-muted">Uploading…</span>}
        {status === "done" && (
          <span className="text-xs font-medium text-grove">✓ {fileName}</span>
        )}
        {adminView && objectKey && (
          <a
            href={`/api/admin/doc?key=${encodeURIComponent(objectKey)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-grove hover:underline"
          >
            View ↗
          </a>
        )}
        {adminView && objectKey && (
          <button type="button" onClick={remove} className="text-xs text-brick-dark hover:underline">
            Remove
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </div>
      {msg && <span className="mt-1 block text-xs text-brick-dark">{msg}</span>}
    </div>
  );
}
