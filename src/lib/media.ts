/*
 * Media service — the backend for the media library.
 *
 * Every uploaded file becomes a row in `media` and an object in R2. Two upload
 * paths are supported:
 *   1. Presigned direct-to-R2 (browser) — createUploadTarget() → client PUTs →
 *      recordUpload(). Best for large files; needs R2 CORS configured.
 *   2. Server-side — uploadBuffer() puts the bytes through the server. Simpler,
 *      no CORS, but bounded by serverless request size (~4.5MB).
 *
 * All functions are server-only and init R2/DB lazily.
 */

import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getDb } from "@/db";
import { media, type Media, type NewMedia } from "@/db/schema";
import { getR2, presignUpload, r2PublicUrl, isR2Configured } from "@/lib/r2";

export const MEDIA_COLLECTIONS = ["events", "merchants", "site", "general"] as const;
export type MediaCollection = (typeof MEDIA_COLLECTIONS)[number];

/** Allowed upload types → keeps junk out of the bucket. */
export const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
]);

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

function normalizeCollection(c?: string): MediaCollection {
  return (MEDIA_COLLECTIONS as readonly string[]).includes(c ?? "")
    ? (c as MediaCollection)
    : "general";
}

/** Builds a collision-proof, namespaced R2 key from a collection + filename. */
export function buildMediaKey(collection: string, filename: string): string {
  const col = normalizeCollection(collection);
  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot >= 0 ? filename.slice(0, dot) : filename)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const stem = `${randomUUID()}${base ? `-${base}` : ""}`;
  return `${col}/${stem}${ext ? `.${ext}` : ""}`;
}

/** Public URL for a media row. */
export function mediaUrl(m: Pick<Media, "r2Key">): string {
  return r2PublicUrl(m.r2Key);
}

/**
 * Path 1a — create a presigned PUT target for a browser upload.
 * Returns the key to PUT to, the signed URL, and the eventual public URL.
 */
export async function createUploadTarget(input: {
  filename: string;
  contentType: string;
  collection?: string;
}): Promise<{ key: string; uploadUrl: string; publicUrl: string }> {
  const key = buildMediaKey(input.collection ?? "general", input.filename);
  const uploadUrl = await presignUpload(key, input.contentType);
  return { key, uploadUrl, publicUrl: r2PublicUrl(key) };
}

/** Path 1b — after a successful direct upload, record the media row. */
export async function recordUpload(input: {
  key: string;
  filename?: string;
  contentType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  altText?: string;
  title?: string;
  collection?: string;
  uploadedByUserId?: string | null;
}): Promise<Media> {
  const values: NewMedia = {
    r2Key: input.key,
    filename: input.filename,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    width: input.width,
    height: input.height,
    altText: input.altText,
    title: input.title,
    collection: normalizeCollection(input.collection),
    uploadedByUserId: input.uploadedByUserId ?? null,
  };
  const [row] = await getDb().insert(media).values(values).returning();
  return row;
}

/** Path 2 — server-side upload: bytes → R2 → media row, in one call. */
export async function uploadBuffer(input: {
  body: Buffer | Uint8Array;
  filename: string;
  contentType: string;
  collection?: string;
  altText?: string;
  uploadedByUserId?: string | null;
}): Promise<Media> {
  const key = buildMediaKey(input.collection ?? "general", input.filename);
  await getR2().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
  return recordUpload({
    key,
    filename: input.filename,
    contentType: input.contentType,
    sizeBytes: input.body.byteLength,
    collection: input.collection,
    altText: input.altText,
    uploadedByUserId: input.uploadedByUserId,
  });
}

/** Delete a media row and its R2 object. */
export async function deleteMedia(id: number): Promise<void> {
  const db = getDb();
  const [row] = await db.select().from(media).where(eq(media.id, id));
  if (!row) return;
  if (isR2Configured()) {
    await getR2().send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: row.r2Key }),
    );
  }
  await db.delete(media).where(eq(media.id, id));
}
