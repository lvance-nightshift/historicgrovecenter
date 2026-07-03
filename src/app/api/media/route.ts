/*
 * GET /api/media?collection=&limit=&offset=
 * Auth-gated. Lists media (newest first) for the picker's library tab.
 */
import { NextResponse } from "next/server";
import { getActor, canManageContent } from "@/lib/auth/authorize";
import { listMedia } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const actor = await getActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageContent(actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const collection = searchParams.get("collection") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "60");
  const offset = Number(searchParams.get("offset") ?? "0");

  const items = await listMedia({
    collection,
    limit: Number.isFinite(limit) ? limit : 60,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  return NextResponse.json({ items });
}
