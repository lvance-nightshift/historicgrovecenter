/*
 * One-off: upload the Pumpkin Fest / Harvest Table sponsor logos (in ./sponsors/)
 * to the public R2 media bucket and emit the sponsor jsonb to scripts/sponsors-data.json.
 *
 *   node --env-file=.env.local scripts/upload-sponsors.mjs
 *
 * R2 is a single bucket shared by dev + prod, so this runs once. Dimensions are
 * known from the source files, so no image library is needed.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// name, file, intrinsic size, presenting flag. Order = display order within tier.
const SPONSORS = [
  { name: "OKLO", file: "OKLO_BIG-7f0d6b98.png", width: 1499, height: 422, presenting: true },
  { name: "Biloski & Miller", file: "biloski.png", width: 465, height: 68 },
  { name: "Jackson Funeral Home & Cremation", file: "JacksonFuneral.png", width: 1254, height: 1254 },
  { name: "Premier Protection & Investigations", file: "PPI.jpg", width: 200, height: 200 },
  { name: "Main Street Lofts", file: "MSL-Logo.jpg", width: 327, height: 220 },
  { name: "Walton George Realty Group", file: "WG-Logo_Main.png", width: 1801, height: 900 },
];

const contentType = (f) =>
  f.endsWith(".png") ? "image/png"
  : /\.jpe?g$/.test(f) ? "image/jpeg"
  : "application/octet-stream";

function keyFor(name, file) {
  const ext = path.extname(file).slice(1).toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `site/${randomUUID()}-${base}${ext ? `.${ext}` : ""}`;
}

const need = (n) => {
  const v = process.env[n];
  if (!v) throw new Error(`${n} is not set (run with --env-file=.env.local)`);
  return v;
};

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${need("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: need("R2_ACCESS_KEY_ID"),
    secretAccessKey: need("R2_SECRET_ACCESS_KEY"),
  },
});
const bucket = need("R2_BUCKET");
const publicBase = need("R2_PUBLIC_URL").replace(/\/$/, "");

const out = [];
for (const s of SPONSORS) {
  const p = path.join("sponsors", s.file);
  const body = fs.readFileSync(p);
  const key = keyFor(s.name, s.file);
  await r2.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType(s.file) }),
  );
  const logoUrl = `${publicBase}/${key}`;
  out.push({
    name: s.name,
    logoUrl,
    width: s.width,
    height: s.height,
    ...(s.presenting ? { presenting: true } : {}),
  });
  console.log("✓ uploaded", s.name, "→", logoUrl);
}

fs.writeFileSync("scripts/sponsors-data.json", JSON.stringify(out, null, 2) + "\n");
console.log(`\nWrote scripts/sponsors-data.json (${out.length} sponsors).`);
