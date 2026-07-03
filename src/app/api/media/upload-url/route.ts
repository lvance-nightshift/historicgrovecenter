/*
 * POST /api/media/upload-url
 * Auth-gated. Body: { filename, contentType, collection? }
 * Returns { key, uploadUrl, publicUrl } — the client PUTs the file to
 * `uploadUrl` (direct to R2), then calls /api/media/record.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  createUploadTarget,
  ALLOWED_CONTENT_TYPES,
  MEDIA_COLLECTIONS,
} from "@/lib/media";
import { isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isR2Configured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  let body: { filename?: string; contentType?: string; collection?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { filename, contentType, collection } = body;
  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType are required" },
      { status: 400 },
    );
  }
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported type: ${contentType}` },
      { status: 415 },
    );
  }
  if (collection && !MEDIA_COLLECTIONS.includes(collection as never)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const target = await createUploadTarget({ filename, contentType, collection });
  return NextResponse.json(target);
}
