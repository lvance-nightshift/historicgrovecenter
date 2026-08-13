/*
 * GET /api/admin/doc?key=pumpkin-fest-docs/...
 *
 * Admin-only. Generates a fresh short-lived signed URL for a private document
 * and redirects to it — so admins can always view food-vendor permits /
 * insurance from the registrations page, without any permanent public link.
 */
import { NextResponse } from "next/server";
import { getActor, isAdmin } from "@/lib/auth/authorize";
import { presignDocDownload } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const actor = await getActor();
  if (!actor || !isAdmin(actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const key = new URL(req.url).searchParams.get("key") ?? "";
  // Only our private docs prefix — never presign arbitrary bucket keys.
  if (!key.startsWith("pumpkin-fest-docs/")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }
  const url = await presignDocDownload(key, 300);
  return NextResponse.redirect(url);
}
