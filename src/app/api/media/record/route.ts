/*
 * POST /api/media/record
 * Auth-gated. Called after a successful direct-to-R2 upload to create the
 * media library row. Body: { key, filename?, contentType?, sizeBytes?,
 * width?, height?, altText?, title?, collection? }
 */
import { NextResponse } from "next/server";
import { getActor, canManageContent } from "@/lib/auth/authorize";
import { recordUpload, mediaUrl } from "@/lib/media";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageContent(actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.key !== "string" || !body.key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  const row = await recordUpload({
    key: body.key,
    filename: typeof body.filename === "string" ? body.filename : undefined,
    contentType: typeof body.contentType === "string" ? body.contentType : undefined,
    sizeBytes: typeof body.sizeBytes === "number" ? body.sizeBytes : undefined,
    width: typeof body.width === "number" ? body.width : undefined,
    height: typeof body.height === "number" ? body.height : undefined,
    altText: typeof body.altText === "string" ? body.altText : undefined,
    title: typeof body.title === "string" ? body.title : undefined,
    collection: typeof body.collection === "string" ? body.collection : undefined,
    uploadedByUserId: actor.user.id,
  });

  return NextResponse.json({ media: { ...row, url: mediaUrl(row) } });
}
