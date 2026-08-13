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
import type { VendorState } from "./vendor-state";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const businessName = String(formData.get("businessName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const products = String(formData.get("products") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const agree = formData.get("agree") != null;

  const fieldErrors: VendorState["fieldErrors"] = {};
  if (!businessName) fieldErrors.businessName = "Please enter your business or booth name.";
  if (!contactName) fieldErrors.contactName = "Please enter a contact name.";
  if (!email) fieldErrors.email = "Please enter your email.";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email.";
  if (!phone) fieldErrors.phone = "Please enter a phone number.";
  if (!products) fieldErrors.products = "Tell us what you'll be offering.";
  if (!agree) fieldErrors.agree = "Please acknowledge the terms.";
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
        })
        .from(events)
        .where(eq(events.slug, slug))
        .limit(1);
      if (!ev || !ev.published || !ev.vendorAppsOpen) {
        return {
          ok: false,
          message: "This event isn't accepting vendor registrations right now.",
        };
      }
      eventRow = { id: ev.id, title: ev.title, startAt: ev.startAt, location: ev.location };
    } catch (err) {
      console.error("event-registration: event lookup failed", err);
      return {
        ok: false,
        message:
          "Something went wrong submitting your registration. Please try again, or email HistoricGroveCenter@gmail.com.",
      };
    }
  }

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
            type: "vendor",
            status: "pending",
            paymentStatus: "unpaid",
            applicationData: {
              vendorType: "vendor",
              businessName,
              contactName,
              email,
              phone,
              products,
              notes: notes || null,
              agreedToTerms: true,
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
        { businessName, contactName, email, phone, products, notes: notes || undefined },
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
    message:
      "Thanks! Your vendor registration has been received. Someone from the Grove Center will follow up to confirm your space. Check your email for a confirmation.",
  };
}
