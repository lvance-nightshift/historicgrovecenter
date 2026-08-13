/*
 * POST /api/pumpkin-fest/upload
 *
 * PUBLIC (unauthenticated) presign for food-vendor permit / insurance docs.
 * Deliberately narrow: PDF/JPG/PNG only, a dedicated `pumpkin-fest-docs/`
 * prefix, random keys (no overwrites), and a short-lived signed URL. The
 * client PUTs the file straight to R2 and submits the returned key with the
 * registration form.
 */
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { presignUpload, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png"]);

export async function POST(req: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "Uploads aren't configured yet." }, { status: 503 });
  }

  let body: { filename?: unknown; contentType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  if (!ALLOWED.has(contentType)) {
    return NextResponse.json(
      { error: "Only PDF, JPG, or PNG files are allowed." },
      { status: 415 },
    );
  }

  const filename = typeof body.filename === "string" ? body.filename : "document";
  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot >= 0 ? filename.slice(0, dot) : filename)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  const key = `pumpkin-fest-docs/${randomUUID()}${base ? `-${base}` : ""}${ext ? `.${ext}` : ""}`;

  const uploadUrl = await presignUpload(key, contentType, 300);
  return NextResponse.json({ key, uploadUrl });
}
