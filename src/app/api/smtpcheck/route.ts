/*
 * TEMPORARY diagnostic — tests whether this deploy environment can reach the
 * SMTP host. DELETE this file once email delivery is confirmed working.
 * Gated by a key so it isn't openly pingable.
 */
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { isEmailConfigured } from "@/lib/email";
import { isDbConfigured } from "@/db";
import { submitContact, initialContactState } from "@/app/actions/contact";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== "grovedebug") {
    return new NextResponse("not found", { status: 404 });
  }

  // Reproduce the real contact-form submission end-to-end.
  if (url.searchParams.get("action") === "1") {
    const fd = new FormData();
    fd.set("name", "Debug Tester");
    fd.set("email", "debug@example.com");
    fd.set("subject", "action path check");
    fd.set("message", "Reproducing the contact action from the debug route.");
    try {
      const result = await submitContact(initialContactState, fd);
      return NextResponse.json({ isDbConfigured: isDbConfigured(), result });
    } catch (e) {
      return NextResponse.json({
        isDbConfigured: isDbConfigured(),
        threw: true,
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack?.split("\n").slice(0, 6) : null,
      });
    }
  }

  const out: Record<string, unknown> = {
    isEmailConfigured: isEmailConfigured(),
    host: process.env.SMTP_HOST ?? null,
    port: process.env.SMTP_PORT ?? null,
    user: process.env.SMTP_USER ?? null,
    hasPass: Boolean(process.env.SMTP_PASS),
  };

  try {
    const port = Number(process.env.SMTP_PORT ?? "465");
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    const t0 = Date.now();
    await t.verify();
    out.verify = "ok";
    out.verifyMs = Date.now() - t0;

    if (url.searchParams.get("send") === "1") {
      const info = await t.sendMail({
        from: `Grove Center Website <${process.env.CONTACT_FROM_EMAIL}>`,
        to: process.env.CONTACT_TO_EMAIL,
        subject: "Grove Center — Vercel SMTP debug test",
        text: "Sent from the Vercel deployment via Zoho SMTP.",
      });
      out.send = "ok";
      out.messageId = info.messageId;
    }
  } catch (e) {
    out.verify = "FAIL";
    out.error = e instanceof Error ? e.message : String(e);
    out.code = (e as { code?: string }).code ?? null;
  }

  return NextResponse.json(out);
}
