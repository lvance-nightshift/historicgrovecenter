/*
 * Browser-side upload flow for the media picker:
 *   1. ask the server for a presigned URL   (POST /api/media/upload-url)
 *   2. PUT the file straight to R2          (needs bucket CORS — configured)
 *   3. record the media row                 (POST /api/media/record)
 *
 * Client-safe (no server-only imports).
 */

export type UploadedMedia = {
  id: number;
  r2Key: string;
  filename: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  collection: string;
  url: string;
};

export { ACCEPTED_CONTENT_TYPES as ACCEPTED_TYPES } from "@/lib/media-shared";

/** Read pixel dimensions for raster images (best-effort). */
async function readImageSize(
  file: File,
): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return {};
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return {};
  }
}

function putToR2(
  url: string,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed (network/CORS)"));
    xhr.send(file);
  });
}

export async function uploadFile(
  file: File,
  collection: string,
  onProgress?: (fraction: number) => void,
): Promise<UploadedMedia> {
  const dims = await readImageSize(file);

  // 1. presign
  const presignRes = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      collection,
    }),
  });
  if (!presignRes.ok) {
    const { error } = await presignRes.json().catch(() => ({}));
    throw new Error(error ?? `Could not start upload (${presignRes.status})`);
  }
  const { key, uploadUrl } = await presignRes.json();

  // 2. upload to R2
  await putToR2(uploadUrl, file, onProgress);

  // 3. record
  const recordRes = await fetch("/api/media/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      width: dims.width,
      height: dims.height,
      collection,
    }),
  });
  if (!recordRes.ok) {
    const { error } = await recordRes.json().catch(() => ({}));
    throw new Error(error ?? `Could not save media (${recordRes.status})`);
  }
  const { media } = await recordRes.json();
  return media as UploadedMedia;
}

export async function fetchMedia(collection?: string): Promise<UploadedMedia[]> {
  const qs = collection ? `?collection=${encodeURIComponent(collection)}` : "";
  const res = await fetch(`/api/media${qs}`);
  if (!res.ok) throw new Error(`Could not load media (${res.status})`);
  const { items } = await res.json();
  return items as UploadedMedia[];
}
