/*
 * Transactional email via SMTP (Zoho Mail).
 *
 * We send the contact-form notification through the association's own Zoho
 * mailbox over SMTP — one free service for both sending and receiving, from a
 * real @historicgrovecenter.com address.
 *
 * LAZY: the transport reads SMTP creds at first send, not at import, so the
 * build stays green without them.
 *
 * Env (see .env.example):
 *   SMTP_HOST            e.g. smtp.zoho.com
 *   SMTP_PORT            465 (SSL) or 587 (STARTTLS); default 465
 *   SMTP_USER            the Zoho mailbox, e.g. info@historicgrovecenter.com
 *   SMTP_PASS            a Zoho app-specific password (NOT the login password)
 *   CONTACT_FROM_EMAIL   sender — must be the mailbox or a verified alias
 *   CONTACT_TO_EMAIL     where contact-form messages are delivered
 */

import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let _transport: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.CONTACT_TO_EMAIL &&
      process.env.CONTACT_FROM_EMAIL,
  );
}

function getTransport(): Transporter {
  if (_transport) return _transport;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST / SMTP_USER / SMTP_PASS are not set.");
  }
  const port = Number(process.env.SMTP_PORT ?? "465");
  _transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // implicit TLS on 465; STARTTLS on 587
    auth: { user, pass },
  });
  return _transport;
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

  return getTransport().sendMail({
    from: `Grove Center Website <${from}>`,
    to,
    replyTo: `${msg.name} <${msg.email}>`,
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
