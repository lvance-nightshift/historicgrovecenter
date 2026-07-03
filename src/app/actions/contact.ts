"use server";

/*
 * Contact-form server action. Stores the submission in Neon (if configured)
 * and emails it to the association via Resend (if configured). Designed to
 * degrade gracefully while credentials are still being wired up.
 *
 * Used from the Visit page form via React's useActionState.
 */

import { getDb, isDbConfigured } from "@/db";
import { contactSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  isEmailConfigured,
  sendContactNotification,
} from "@/lib/email";

export type ContactState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
};

export const initialContactState: ContactState = { ok: false, message: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const fieldErrors: ContactState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Please enter your name.";
  if (!email) fieldErrors.email = "Please enter your email.";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email.";
  if (!message) fieldErrors.message = "Please enter a message.";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  const payload = { name, email, subject: subject || undefined, message };

  // If nothing is wired up yet, don't pretend we sent it.
  if (!isDbConfigured() && !isEmailConfigured()) {
    return {
      ok: false,
      message:
        "The contact form isn't connected yet. Please email us directly for now.",
    };
  }

  // 1) Persist the submission (best-effort) so nothing is lost.
  let submissionId: number | null = null;
  if (isDbConfigured()) {
    try {
      const [row] = await getDb()
        .insert(contactSubmissions)
        .values({ name, email, subject: subject || null, message })
        .returning({ id: contactSubmissions.id });
      submissionId = row?.id ?? null;
    } catch (err) {
      console.error("contact: failed to store submission", err);
    }
  }

  // 2) Email the association.
  if (isEmailConfigured()) {
    try {
      await sendContactNotification(payload);
      if (submissionId !== null) {
        await getDb()
          .update(contactSubmissions)
          .set({ emailStatus: "sent" })
          .where(eq(contactSubmissions.id, submissionId));
      }
    } catch (err) {
      console.error("contact: failed to send email", err);
      if (submissionId !== null) {
        await getDb()
          .update(contactSubmissions)
          .set({ emailStatus: "failed" })
          .where(eq(contactSubmissions.id, submissionId))
          .catch(() => {});
      }
      // Stored but not emailed — still count as received if we saved it.
      if (submissionId === null) {
        return {
          ok: false,
          message: "Something went wrong sending your message. Please try again.",
        };
      }
    }
  }

  return {
    ok: true,
    message: "Thanks! Your message has been received — we'll be in touch soon.",
  };
}
