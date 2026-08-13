"use client";

import { useRef, useState } from "react";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/*
 * A single-file uploader for a food vendor's permit / insurance doc. Uploads
 * straight to R2 via a public presigned URL and exposes the resulting object
 * key through a hidden <input name={name}> so it submits with the form.
 */
export default function DocUpload({ name, label }: { name: string; label: string }) {
  const [objectKey, setObjectKey] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState("");
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
      setMsg("File is too large (max 10 MB).");
      return;
    }
    setStatus("uploading");
    setFileName(file.name);
    try {
      const res = await fetch("/api/pumpkin-fest/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) throw new Error("presign failed");
      const { key, uploadUrl } = await res.json();
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("upload failed");
      setObjectKey(key);
      setStatus("done");
    } catch {
      setStatus("error");
      setMsg("Upload failed. Please try again.");
    }
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
