/*
 * Transactional email via Resend.
 *
 * LAZY: the Resend client reads RESEND_API_KEY, which isn't set at build time,
 * so it's constructed on first send.
 *
 * Env (see .env.example):
 *   RESEND_API_KEY       Resend API key
 *   CONTACT_TO_EMAIL     where contact-form messages are delivered
 *                        (e.g. the Zoho mailbox, info@historicgrovecenter.com)
 *   CONTACT_FROM_EMAIL   verified Resend sender (e.g. website@historicgrovecenter.com)
 */

import "server-only";
import { Resend } from "resend";

let _resend: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.CONTACT_TO_EMAIL &&
      process.env.CONTACT_FROM_EMAIL,
  );
}

function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set.");
  _resend = new Resend(key);
  return _resend;
}

export type ContactMessage = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

/** Emails a contact-form submission to the association mailbox. */
export async function sendContactNotification(msg: ContactMessage) {
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!to || !from) {
    throw new Error("CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL are not set.");
  }

  const subject = msg.subject?.trim()
    ? `Grove Center contact: ${msg.subject}`
    : "New Grove Center contact-form message";

  return getResend().emails.send({
    from,
    to,
    replyTo: msg.email,
    subject,
    text: [
      `Name:    ${msg.name}`,
      `Email:   ${msg.email}`,
      msg.subject ? `Subject: ${msg.subject}` : null,
      "",
      msg.message,
    ]
      .filter((l) => l !== null)
      .join("\n"),
  });
}
