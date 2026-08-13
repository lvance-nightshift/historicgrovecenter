"use server";

/*
 * Generic event vendor-registration action — for ANY published event that has
 * vendor sign-ups open (events.vendorAppsOpen). Unlike the Fall Pumpkin Fest
 * action (which is bespoke: booth-fee math, craft/food variants, doc uploads),
 * this collects the common vendor fields and stores the submission as an
 * `event_participations` row (type=vendor, status=pending) so it shows up in
 * the same admin registrations view.
 *
 * The event is identified by a hidden `eventSlug` field. We re-validate it
 * server-side (published + vendorAppsOpen) — never trust the client's slug.
 */

import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { events, eventParticipations, people } from "@/db/schema";
import { isEmailConfigured, sendEventRegistrationEmails } from "@/lib/email";
import { presignDocDownload } from "@/lib/r2";
import type { VendorState } from "./vendor-state";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

async function docUrl(key: string): Promise<string | undefined> {
  if (!key) return undefined;
  try {
    return await presignDocDownload(key); // short-lived signed link (private)
  } catch {
    return undefined;
  }
}

const etDateLabel = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

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
    console.error("event-registration: person upsert failed", err);
    return null;
  }
}

export async function submitEventRegistration(
  _prev: VendorState,
  formData: FormData,
): Promise<VendorState> {
  // Honeypot — bots fill hidden fields; humans never see it.
  if (String(formData.get("company_website") ?? "").trim() !== "") {
    return { ok: true, message: "Thanks! Your registration has been received." };
  }

  const slug = String(formData.get("eventSlug") ?? "").trim();
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
  spaces = Math.floor(spaces);

  const fieldErrors: VendorState["fieldErrors"] = {};
  if (!businessName) fieldErrors.businessName = "Please enter your business or booth name.";
  if (!contactName) fieldErrors.contactName = "Please enter a contact name.";
  if (!email) fieldErrors.email = "Please enter your email.";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email.";
  if (!phone) fieldErrors.phone = "Please enter a phone number.";
  if (!products) fieldErrors.products = isFood ? "Tell us what you'll be serving." : "Tell us what you'll be offering.";
  if (!agree) fieldErrors.agree = "Please acknowledge the terms.";
  if (isFood && !permitDocKey) fieldErrors.permit = "Please upload your food-service permit.";
  if (isFood && !insuranceDocKey) fieldErrors.insurance = "Please upload your certificate of insurance.";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
  }

  if (!isDbConfigured() && !isEmailConfigured()) {
    return {
      ok: false,
      message:
        "Registration isn't connected yet. Please email HistoricGroveCenter@gmail.com to reserve a space.",
    };
  }

  // Look up the event and confirm it's actually taking registrations.
  let eventRow: {
    id: number;
    title: string;
    startAt: Date | null;
    location: string | null;
    boothFeeCents: number | null;
  } | null = null;
  if (isDbConfigured()) {
    try {
      const [ev] = await getDb()
        .select({
          id: events.id,
          title: events.title,
          startAt: events.startAt,
          location: events.location,
          published: events.published,
          vendorAppsOpen: events.vendorAppsOpen,
          foodAppsOpen: events.foodAppsOpen,
          boothFeeCents: events.boothFeeCents,
        })
        .from(events)
        .where(eq(events.slug, slug))
        .limit(1);
      const intakeOpen = ev && ev.published && (isFood ? ev.foodAppsOpen : ev.vendorAppsOpen);
      if (!intakeOpen) {
        return {
          ok: false,
          message: isFood
            ? "This event isn't accepting food-truck registrations right now."
            : "This event isn't accepting vendor registrations right now.",
        };
      }
      eventRow = {
        id: ev.id,
        title: ev.title,
        startAt: ev.startAt,
        location: ev.location,
        boothFeeCents: ev.boothFeeCents,
      };
    } catch (err) {
      console.error("event-registration: event lookup failed", err);
      return {
        ok: false,
        message:
          "Something went wrong submitting your registration. Please try again, or email HistoricGroveCenter@gmail.com.",
      };
    }
  }

  // Fee is authoritative from the event (never trust the client): fee × spaces.
  const perSpaceCents = eventRow?.boothFeeCents ?? null;
  const feeCents = perSpaceCents ? perSpaceCents * spaces : null;
  const feeLabel =
    feeCents != null
      ? spaces === 1
        ? dollars(perSpaceCents!)
        : `${dollars(feeCents)} (${spaces} × ${dollars(perSpaceCents!)})`
      : undefined;

  // 1) Persist the registration (best-effort).
  let participationId: number | null = null;
  if (isDbConfigured() && eventRow) {
    try {
      const db = getDb();
      const personId = await upsertPerson(contactName, email, phone);
      const [dupe] = personId
        ? await db
            .select({ id: eventParticipations.id })
            .from(eventParticipations)
            .where(
              and(
                eq(eventParticipations.eventId, eventRow.id),
                eq(eventParticipations.personId, personId),
              ),
            )
        : [];

      if (!dupe) {
        const [row] = await db
          .insert(eventParticipations)
          .values({
            eventId: eventRow.id,
            personId,
            type: isFood ? "food_vendor" : "vendor",
            status: "pending",
            feeAmountCents: feeCents,
            paymentStatus: "unpaid",
            permitDocKey: isFood ? permitDocKey || null : null,
            insuranceDocKey: isFood ? insuranceDocKey || null : null,
            applicationData: {
              vendorType: isFood ? "food" : "vendor",
              businessName,
              contactName,
              email,
              phone,
              products,
              spaces,
              notes: notes || null,
              agreedToTerms: true,
              ...(isFood
                ? { permitUploaded: Boolean(permitDocKey), insuranceUploaded: Boolean(insuranceDocKey) }
                : {}),
              source: "event-web-form",
            },
            notes: notes || null,
          })
          .returning({ id: eventParticipations.id });
        participationId = row?.id ?? null;
      } else {
        participationId = dupe.id;
      }
    } catch (err) {
      console.error("event-registration: failed to store registration", err);
    }
  }

  // 2) Email organizer + registrant confirmation.
  if (isEmailConfigured() && eventRow) {
    try {
      await sendEventRegistrationEmails(
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
        {
          name: eventRow.title,
          dateLabel: eventRow.startAt ? etDateLabel.format(eventRow.startAt) : undefined,
          location: eventRow.location ?? undefined,
        },
      );
    } catch (err) {
      console.error("event-registration: failed to send email", err);
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
      ? "Thanks! Your food-vendor registration and documents have been received. Someone from the Grove Center will follow up to confirm your space. Check your email for a confirmation."
      : "Thanks! Your vendor registration has been received. Someone from the Grove Center will follow up to confirm your space. Check your email for a confirmation.",
  };
}
