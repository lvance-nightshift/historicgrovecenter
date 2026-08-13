/*
 * POST /api/pumpkin-fest/upload  (multipart: field "file")
 *
 * PUBLIC upload for food-vendor permit / insurance docs. The file is sent to
 * the server (same-origin, no CORS) and stored server-side in the PRIVATE docs
 * bucket. Narrow by design: PDF/JPG/PNG only, ≤4 MB, random key. Returns the
 * object key, which the form submits; the doc is only ever read via short-lived
 * signed URLs (admin view / organizer email).
 */
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { putDoc, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "Uploads aren't configured yet." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only PDF, JPG, or PNG files are allowed." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 4 MB)." }, { status: 413 });
  }

  const name = file.name || "document";
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  const key = `pumpkin-fest-docs/${randomUUID()}${base ? `-${base}` : ""}${ext ? `.${ext}` : ""}`;

  const buf = new Uint8Array(await file.arrayBuffer());
  await putDoc(key, buf, file.type);

  return NextResponse.json({ key });
}
