"use server";

/*
 * Fall Pumpkin Fest vendor-registration action — handles BOTH the
 * craft/artisan form and the food-vendor form (distinguished by the hidden
 * `vendorType` field). Stores the registration as an `event_participations`
 * row (type=vendor | food_vendor, status=pending), best-effort links/creates
 * the contact person, and emails the organizer + the vendor. Degrades
 * gracefully while DB/email creds are being wired up.
 */

import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { events, eventParticipations, people } from "@/db/schema";
import { isEmailConfigured, sendVendorRegistrationEmails } from "@/lib/email";
import { presignDocDownload } from "@/lib/r2";
import { PUMPKIN_FEST } from "@/lib/pumpkin-fest";
import type { VendorState } from "./vendor-state";

async function docUrl(key: string): Promise<string | undefined> {
  if (!key) return undefined;
  try {
    return await presignDocDownload(key); // short-lived signed link (private)
  } catch {
    return undefined;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/** Find (by email) or create a lightweight person record. Best-effort. */
async function upsertPerson(
  contactName: string,
  email: string,
  phone: string,
): Promise<number | null> {
  try {
    const db = getDb();
    const [existing] = await db
      .select({ id: people.id })
      .from(people)
      .where(eq(people.email, email));
    if (existing) return existing.id;

    const i = contactName.indexOf(" ");
    const firstName = i === -1 ? contactName : contactName.slice(0, i);
    const lastName = i === -1 ? null : contactName.slice(i + 1);
    const [created] = await db
      .insert(people)
      .values({ firstName, lastName, email, phone: phone || null })
      .returning({ id: people.id });
    return created?.id ?? null;
  } catch (err) {
    console.error("vendor-registration: person upsert failed", err);
    return null;
  }
}

export async function submitVendorRegistration(
  _prev: VendorState,
  formData: FormData,
): Promise<VendorState> {
  // Honeypot — bots fill hidden fields; humans never see it.
  if (String(formData.get("company_website") ?? "").trim() !== "") {
    return { ok: true, message: "Thanks! Your registration has been received." };
  }

  const isFood = String(formData.get("vendorType") ?? "") === "food";

  const businessName = String(formData.get("businessName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const products = String(formData.get("products") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const agree = formData.get("agree") != null;
  const permitDocKey = String(formData.get("permitDocKey") ?? "").trim();
  const insuranceDocKey = String(formData.get("insuranceDocKey") ?? "").trim();
  let spaces = Number(formData.get("spaces") ?? "1");
  if (!Number.isFinite(spaces) || spaces < 1) spaces = 1;
  if (spaces > 5) spaces = 5;

  const productsLabel = isFood ? "Tell us what you'll be serving." : "Tell us what you'll be selling.";
  const fieldErrors: VendorState["fieldErrors"] = {};
  if (!businessName) fieldErrors.businessName = "Please enter your business or booth name.";
  if (!contactName) fieldErrors.contactName = "Please enter a contact name.";
  if (!email) fieldErrors.email = "Please enter your email.";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email.";
  if (!phone) fieldErrors.phone = "Please enter a phone number.";
  if (!products) fieldErrors.products = productsLabel;
  if (!agree) fieldErrors.agree = "Please acknowledge the booth fee and terms.";
  if (isFood && !permitDocKey) fieldErrors.permit = "Please upload your Oak Ridge food permit.";
  if (isFood && !insuranceDocKey) fieldErrors.insurance = "Please upload your certificate of insurance.";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
  }

  const feeCents = spaces * PUMPKIN_FEST.boothFeeCents;
  const feeLabel =
    spaces === 1
      ? dollars(PUMPKIN_FEST.boothFeeCents)
      : `${dollars(feeCents)} (${spaces} × ${dollars(PUMPKIN_FEST.boothFeeCents)})`;

  // Nothing wired up yet — don't pretend we saved it.
  if (!isDbConfigured() && !isEmailConfigured()) {
    return {
      ok: false,
      message:
        "Registration isn't connected yet. Please email HistoricGroveCenter@gmail.com to reserve a space.",
    };
  }

  // 1) Persist the registration (best-effort).
  let participationId: number | null = null;
  if (isDbConfigured()) {
    try {
      const db = getDb();
      const [ev] = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.slug, PUMPKIN_FEST.slug));
      if (ev) {
        const personId = await upsertPerson(contactName, email, phone);
        const [dupe] = personId
          ? await db
              .select({ id: eventParticipations.id })
              .from(eventParticipations)
              .where(
                and(
                  eq(eventParticipations.eventId, ev.id),
                  eq(eventParticipations.personId, personId),
                ),
              )
          : [];

        if (!dupe) {
          const [row] = await db
            .insert(eventParticipations)
            .values({
              eventId: ev.id,
              personId,
              type: isFood ? "food_vendor" : "vendor",
              status: "pending",
              feeAmountCents: feeCents,
              paymentStatus: "unpaid",
              permitDocKey: isFood ? permitDocKey || null : null,
              insuranceDocKey: isFood ? insuranceDocKey || null : null,
              applicationData: {
                vendorType: isFood ? "food" : "craft",
                businessName,
                contactName,
                email,
                phone,
                products,
                spaces,
                notes: notes || null,
                agreedToFee: true,
                ...(isFood
                  ? { permitUploaded: Boolean(permitDocKey), insuranceUploaded: Boolean(insuranceDocKey) }
                  : {}),
                source: "pumpkin-fest-web-form",
              },
              notes: notes || null,
            })
            .returning({ id: eventParticipations.id });
          participationId = row?.id ?? null;
        } else {
          participationId = dupe.id;
        }
      } else {
        console.error("vendor-registration: event not found for slug", PUMPKIN_FEST.slug);
      }
    } catch (err) {
      console.error("vendor-registration: failed to store registration", err);
    }
  }

  // 2) Email organizer + vendor confirmation.
  if (isEmailConfigured()) {
    try {
      await sendVendorRegistrationEmails(
        {
          businessName,
          contactName,
          email,
          phone,
          products,
          spaces,
          feeLabel,
          notes: notes || undefined,
          isFood,
          permitUrl: isFood ? await docUrl(permitDocKey) : undefined,
          insuranceUrl: isFood ? await docUrl(insuranceDocKey) : undefined,
        },
        PUMPKIN_FEST.title,
      );
    } catch (err) {
      console.error("vendor-registration: failed to send email", err);
      if (participationId === null) {
        return {
          ok: false,
          message:
            "Something went wrong submitting your registration. Please try again, or email HistoricGroveCenter@gmail.com.",
        };
      }
    }
  }

  return {
    ok: true,
    message: isFood
      ? "Thanks! Your food-vendor registration and documents have been received. Someone from the Grove Center will follow up to confirm your space and booth fee. Check your email for a confirmation."
      : "Thanks! Your vendor registration has been received. Spaces are limited and first come, first served — someone from the Grove Center will follow up to confirm your booth and booth fee. Check your email for a confirmation.",
  };
}
