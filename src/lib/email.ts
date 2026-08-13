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
    // Fail fast instead of hanging the serverless function if the SMTP host
    // is slow or unreachable from the deploy environment.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
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

/* ------------------------------------------------------------------ *
 * Fall Pumpkin Fest — vendor registration.
 * ------------------------------------------------------------------ */

export type VendorRegistration = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  products: string;
  spaces: number;
  feeLabel: string; // e.g. "$90 (2 × $45)"
  notes?: string;
  isFood?: boolean;
  permitUrl?: string;
  insuranceUrl?: string;
};

/**
 * Notifies the organizer of a new vendor registration and sends the vendor a
 * confirmation. Best-effort: throws if the transport can't be built, so the
 * caller can record the email status. `eventName` is the human event title.
 */
export async function sendVendorRegistrationEmails(
  reg: VendorRegistration,
  eventName: string,
) {
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!to || !from) {
    throw new Error("CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL are not set.");
  }
  const transport = getTransport();

  // 1) Organizer notification.
  const organizerMail = transport.sendMail({
    from: `Grove Center Website <${from}>`,
    to,
    replyTo: `${reg.contactName} <${reg.email}>`,
    subject: `New ${eventName} ${reg.isFood ? "FOOD " : ""}vendor registration — ${reg.businessName}`,
    text: [
      `New ${reg.isFood ? "food " : ""}vendor registration for ${eventName}:`,
      "",
      `Business:  ${reg.businessName}`,
      `Contact:   ${reg.contactName}`,
      `Email:     ${reg.email}`,
      `Phone:     ${reg.phone}`,
      `${reg.isFood ? "Serves:   " : "Sells:    "}${reg.products}`,
      `Spaces:    ${reg.spaces}`,
      `Booth fee: ${reg.feeLabel}`,
      reg.isFood && reg.permitUrl ? `Permit:    ${reg.permitUrl}` : null,
      reg.isFood && reg.insuranceUrl ? `Insurance: ${reg.insuranceUrl}` : null,
      reg.notes ? `Notes:     ${reg.notes}` : null,
      "",
      reg.isFood
        ? "Follow up to confirm the space and collect payment. The permit + certificate of insurance are linked above."
        : "Follow up to confirm the booth space and collect payment.",
    ]
      .filter((l) => l !== null)
      .join("\n"),
  });

  // 2) Vendor confirmation.
  const vendorMail = transport.sendMail({
    from: `Historic Grove Center <${from}>`,
    to: `${reg.contactName} <${reg.email}>`,
    subject: `We received your ${eventName} vendor registration`,
    text: [
      `Hi ${reg.contactName},`,
      "",
      `Thanks for registering ${reg.businessName} as a vendor for the ${eventName} on Saturday, October 17, 2026 at the Historic Grove Center in Oak Ridge, TN.`,
      "",
      `Spaces requested: ${reg.spaces}`,
      `Booth fee:        ${reg.feeLabel}`,
      "",
      "This is a request to reserve a space — it isn't confirmed yet. Spaces are limited and assigned first come, first served. Someone from the Grove Center will be in touch to confirm your space and arrange the booth fee.",
      ...(reg.isFood
        ? [
            "",
            "We received your Oak Ridge food permit and certificate of insurance with your registration — thank you. If anything needs updating, just reply to this email.",
          ]
        : []),
      "",
      "Event day: vendor setup begins at 7 a.m., the street closes at 9 a.m., and the festival runs 10 a.m.–4 p.m.",
      "",
      "Questions? Reply to this email or contact Shad at HistoricGroveCenter@gmail.com / 865-482-9251.",
      "",
      "— Historic Grove Center & Friends of the Grove Theater",
    ].join("\n"),
  });

  // Send both; surface an error if either fails.
  await Promise.all([organizerMail, vendorMail]);
}

/* ------------------------------------------------------------------ *
 * Merchant invite — asks a business owner to claim their listing.
 * ------------------------------------------------------------------ */

export async function sendMerchantInvite(input: {
  email: string;
  businessName: string;
  claimUrl: string;
}) {
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!from) throw new Error("CONTACT_FROM_EMAIL is not set.");

  return getTransport().sendMail({
    from: `Historic Grove Center <${from}>`,
    to: input.email,
    subject: `Manage ${input.businessName} on Historic Grove Center`,
    text: [
      `You've been invited to manage ${input.businessName}'s listing on the`,
      `Historic Grove Center website.`,
      "",
      "Set up your account to edit your business info, hours, photos, and events:",
      input.claimUrl,
      "",
      "Use this email address when you create your account so it links to your",
      "business automatically. Once you're in, your changes go live right away.",
      "",
      "— Historic Grove Center",
    ].join("\n"),
  });
}
