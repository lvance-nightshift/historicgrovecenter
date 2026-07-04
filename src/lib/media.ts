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
import { and, eq, desc, inArray } from "drizzle-orm";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getDb } from "@/db";
import {
  media,
  mediaAttachments,
  tags,
  mediaTags,
  type Media,
  type NewMedia,
} from "@/db/schema";
import { getR2, presignUpload, r2PublicUrl, isR2Configured } from "@/lib/r2";
import {
  MEDIA_COLLECTIONS,
  ACCEPTED_CONTENT_TYPES,
  MAX_UPLOAD_BYTES,
  type MediaCollection,
} from "@/lib/media-shared";

export { MEDIA_COLLECTIONS, MAX_UPLOAD_BYTES, type MediaCollection };

/** Allowed upload types → keeps junk out of the bucket. */
export const ALLOWED_CONTENT_TYPES = new Set<string>(ACCEPTED_CONTENT_TYPES);

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

export type MediaTagRef = { id: number; name: string };
export type MediaWithUrl = Media & { url: string; tags: MediaTagRef[] };

/** Tags applied to a set of media, grouped by media id. */
async function tagsForMedia(
  mediaIds: number[],
): Promise<Map<number, MediaTagRef[]>> {
  const map = new Map<number, MediaTagRef[]>();
  if (mediaIds.length === 0) return map;
  const rows = await getDb()
    .select({ mediaId: mediaTags.mediaId, id: tags.id, name: tags.name })
    .from(mediaTags)
    .innerJoin(tags, eq(mediaTags.tagId, tags.id))
    .where(inArray(mediaTags.mediaId, mediaIds));
  for (const r of rows) {
    const list = map.get(r.mediaId) ?? [];
    list.push({ id: r.id, name: r.name });
    map.set(r.mediaId, list);
  }
  return map;
}

/** List media for the picker, newest first, optionally filtered by collection. */
export async function listMedia(opts?: {
  collection?: string;
  limit?: number;
  offset?: number;
}): Promise<MediaWithUrl[]> {
  const db = getDb();
  const limit = Math.min(Math.max(opts?.limit ?? 60, 1), 200);
  const offset = Math.max(opts?.offset ?? 0, 0);
  const filter =
    opts?.collection && (MEDIA_COLLECTIONS as readonly string[]).includes(opts.collection)
      ? eq(media.collection, opts.collection)
      : undefined;

  const rows = await db
    .select()
    .from(media)
    .where(filter)
    .orderBy(desc(media.createdAt))
    .limit(limit)
    .offset(offset);

  const byMedia = await tagsForMedia(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, url: mediaUrl(r), tags: byMedia.get(r.id) ?? [] }));
}

/* -------- Site-wide media (hero, etc.) via media_attachments -------- */

/** The media currently attached site-wide for a purpose (e.g. "home_hero"). */
export async function getSiteMedia(
  purpose: string,
): Promise<MediaWithUrl | null> {
  const rows = await getDb()
    .select()
    .from(media)
    .innerJoin(mediaAttachments, eq(mediaAttachments.mediaId, media.id))
    .where(
      and(
        eq(mediaAttachments.targetType, "site"),
        eq(mediaAttachments.purpose, purpose),
      ),
    )
    .orderBy(desc(mediaAttachments.id))
    .limit(1);
  const m = rows[0]?.media;
  if (!m) return null;
  const byMedia = await tagsForMedia([m.id]);
  return { ...m, url: mediaUrl(m), tags: byMedia.get(m.id) ?? [] };
}

/** Set (or clear, with null) the site-wide media for a purpose. */
export async function setSiteMedia(
  purpose: string,
  mediaId: number | null,
): Promise<void> {
  const db = getDb();
  await db
    .delete(mediaAttachments)
    .where(
      and(
        eq(mediaAttachments.targetType, "site"),
        eq(mediaAttachments.purpose, purpose),
      ),
    );
  if (mediaId != null) {
    await db.insert(mediaAttachments).values({
      mediaId,
      targetType: "site",
      targetId: null,
      purpose,
    });
  }
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

/* -------- Metadata & tags -------- */

const cleanStr = (v?: string | null): string | null => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

function slugifyTag(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Update a media item's editable metadata (title, alt text, credit). */
export async function updateMediaMeta(
  mediaId: number,
  input: { title?: string | null; altText?: string | null; credit?: string | null },
): Promise<void> {
  await getDb()
    .update(media)
    .set({
      title: cleanStr(input.title),
      altText: cleanStr(input.altText),
      credit: cleanStr(input.credit),
    })
    .where(eq(media.id, mediaId));
}

/** Tag a media item, creating the tag if it doesn't exist. Idempotent. */
export async function addMediaTag(
  mediaId: number,
  name: string,
): Promise<MediaTagRef | null> {
  const db = getDb();
  const clean = name.trim();
  const slug = slugifyTag(clean);
  if (!clean || !slug) return null;

  let [tag] = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.slug, slug));
  if (!tag) {
    [tag] = await db
      .insert(tags)
      .values({ name: clean, slug })
      .returning({ id: tags.id, name: tags.name });
  }
  await db.insert(mediaTags).values({ mediaId, tagId: tag.id }).onConflictDoNothing();
  return { id: tag.id, name: tag.name };
}

export async function removeMediaTag(
  mediaId: number,
  tagId: number,
): Promise<void> {
  await getDb()
    .delete(mediaTags)
    .where(and(eq(mediaTags.mediaId, mediaId), eq(mediaTags.tagId, tagId)));
}
