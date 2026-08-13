/*
 * Cloudflare R2 (S3-compatible) client for image storage.
 *
 * LAZY: R2 credentials aren't present at build time, so the client is only
 * constructed on first use. Import { getR2, presignUpload, r2PublicUrl } and
 * call inside server actions / route handlers.
 *
 * Env (see .env.example):
 *   R2_ACCOUNT_ID          Cloudflare account id
 *   R2_ACCESS_KEY_ID       R2 API token access key
 *   R2_SECRET_ACCESS_KEY   R2 API token secret
 *   R2_BUCKET              bucket name
 *   R2_PUBLIC_URL          public base URL for served objects
 *                          (r2.dev URL or a custom domain), no trailing slash
 */

import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client: S3Client | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `${name} is not set. Add your Cloudflare R2 config to .env.local and Vercel.`,
    );
  }
  return v;
}

export function getR2(): S3Client {
  if (_client) return _client;

  const accountId = requireEnv("R2_ACCOUNT_ID");
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return _client;
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

/** Presigned URL for a browser to PUT an object directly to R2. */
export function presignUpload(
  key: string,
  contentType: string,
  expiresInSeconds = 300,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: requireEnv("R2_BUCKET"),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getR2(), command, { expiresIn: expiresInSeconds });
}

/** Presigned URL to GET a (private) object — not needed for public buckets. */
export function presignDownload(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: requireEnv("R2_BUCKET"),
    Key: key,
  });
  return getSignedUrl(getR2(), command, { expiresIn: expiresInSeconds });
}

/** Public URL for an object served via R2's public bucket or custom domain. */
export function r2PublicUrl(key: string): string {
  const base = requireEnv("R2_PUBLIC_URL").replace(/\/$/, "");
  return `${base}/${key.replace(/^\//, "")}`;
}

/* ----------------------------------------------------------------------- *
 * Private documents (food-vendor permits / insurance).
 *
 * These must NOT be in the public media bucket. Set R2_DOCS_BUCKET to a
 * SEPARATE bucket with public access turned OFF. Uploads go through the
 * server (no browser CORS needed) and are only ever read via short-lived
 * signed URLs. Falls back to the media bucket if unset — in which case the
 * docs are NOT actually private, so configure it before relying on this.
 * ----------------------------------------------------------------------- */

function docsBucket(): string {
  return process.env.R2_DOCS_BUCKET || requireEnv("R2_BUCKET");
}

/** True when a dedicated private docs bucket is configured. */
export function docsBucketConfigured(): boolean {
  return Boolean(process.env.R2_DOCS_BUCKET);
}

/** Server-side upload of a private document to the docs bucket. */
export async function putDoc(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  await getR2().send(
    new PutObjectCommand({
      Bucket: docsBucket(),
      Key: key,
      ContentType: contentType,
      Body: body,
    }),
  );
}

/** Short-lived signed URL to view a private document (default 7 days, the max). */
export function presignDocDownload(
  key: string,
  expiresInSeconds = 604800,
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: docsBucket(), Key: key });
  return getSignedUrl(getR2(), command, { expiresIn: expiresInSeconds });
}
