/*
 * Media constants shared by server (media.ts) and client (media-client.ts,
 * components). No server-only or browser APIs here so both sides can import it.
 */

export const MEDIA_COLLECTIONS = [
  "events",
  "merchants",
  "site",
  "general",
] as const;
export type MediaCollection = (typeof MEDIA_COLLECTIONS)[number];

export const ACCEPTED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
] as const;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
