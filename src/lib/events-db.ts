/*
 * Business events — data access (server-only).
 *
 * A merchant's own events (type='business', owner_company_id = their company):
 * concerts, sales, workshops, etc. They self-manage these from the dashboard;
 * they show on the merchant's public page.
 */

import "server-only";
import { and, asc, desc, eq, gte, isNotNull, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { companies, events, eventParticipations } from "@/db/schema";
import type { PublicEvent } from "@/lib/events";

export type EventRegistration = {
  id: number;
  type: string;
  status: string;
  feeAmountCents: number | null;
  paymentStatus: string | null;
  permitDocKey: string | null;
  insuranceDocKey: string | null;
  createdAt: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  products: string;
  spaces: number | null;
  notes: string | null;
};

/** Vendor/registration submissions for an event (from the public forms). */
export async function getEventRegistrations(eventId: number): Promise<EventRegistration[]> {
  try {
    const rows = await getDb()
      .select({
        id: eventParticipations.id,
        type: eventParticipations.type,
        status: eventParticipations.status,
        feeAmountCents: eventParticipations.feeAmountCents,
        paymentStatus: eventParticipations.paymentStatus,
        permitDocKey: eventParticipations.permitDocKey,
        insuranceDocKey: eventParticipations.insuranceDocKey,
        createdAt: eventParticipations.createdAt,
        data: eventParticipations.applicationData,
        notes: eventParticipations.notes,
      })
      .from(eventParticipations)
      .where(eq(eventParticipations.eventId, eventId))
      .orderBy(desc(eventParticipations.createdAt));

    return rows.map((r) => {
      const d = (r.data ?? {}) as Record<string, unknown>;
      const str = (v: unknown) => (typeof v === "string" ? v : "");
      return {
        id: r.id,
        type: r.type,
        status: r.status,
        feeAmountCents: r.feeAmountCents,
        paymentStatus: r.paymentStatus,
        permitDocKey: r.permitDocKey,
        insuranceDocKey: r.insuranceDocKey,
        createdAt: r.createdAt ? r.createdAt.toISOString() : "",
        businessName: str(d.businessName),
        contactName: str(d.contactName),
        email: str(d.email),
        phone: str(d.phone),
        products: str(d.products),
        spaces: typeof d.spaces === "number" ? d.spaces : null,
        notes: r.notes ?? (typeof d.notes === "string" ? d.notes : null),
      };
    });
  } catch (err) {
    console.error("getEventRegistrations failed", err);
    return [];
  }
}

const etDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const etTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  minute: "2-digit",
});

/** Published, dated events for the public calendar, split upcoming/past. */
export async function getPublicEvents(): Promise<{
  upcoming: PublicEvent[];
  past: PublicEvent[];
}> {
  try {
    const rows = await getDb()
      .select({
        slug: events.slug,
        title: events.title,
        type: events.type,
        startAt: events.startAt,
        endAt: events.endAt,
        location: events.location,
        description: events.description,
        ownerName: companies.name,
      })
      .from(events)
      .leftJoin(companies, eq(companies.id, events.ownerCompanyId))
      .where(and(eq(events.published, true), isNotNull(events.startAt)))
      .orderBy(asc(events.startAt));

    const today = etDate.format(new Date());
    const upcoming: PublicEvent[] = [];
    const past: PublicEvent[] = [];
    for (const r of rows) {
      if (!r.startAt) continue;
      const date = etDate.format(r.startAt);
      const desc = (r.description ?? "").trim();
      const ev: PublicEvent = {
        slug: r.slug,
        title: r.title,
        date,
        startTime: etTime.format(r.startAt),
        endTime: r.endAt ? etTime.format(r.endAt) : undefined,
        location: r.location ?? "Historic Grove Center",
        badge: r.type === "business" ? r.ownerName ?? "Merchant event" : "Grove Center",
        summary: desc ? (desc.length > 140 ? `${desc.slice(0, 137)}…` : desc) : "",
      };
      if (date >= today) upcoming.push(ev);
      else past.push(ev);
    }
    past.reverse(); // most recent first
    return { upcoming, past };
  } catch (err) {
    console.error("getPublicEvents failed", err);
    return { upcoming: [], past: [] };
  }
}

export type MerchantEvent = {
  id: number;
  title: string;
  startAt: string | null; // ISO
  endAt: string | null; // ISO
  location: string | null;
  description: string | null;
  published: boolean;
};

type Row = {
  id: number;
  title: string;
  startAt: Date | null;
  endAt: Date | null;
  location: string | null;
  description: string | null;
  published: boolean;
};

function toEvent(r: Row): MerchantEvent {
  return {
    id: r.id,
    title: r.title,
    startAt: r.startAt ? r.startAt.toISOString() : null,
    endAt: r.endAt ? r.endAt.toISOString() : null,
    location: r.location,
    description: r.description,
    published: r.published,
  };
}

const selection = {
  id: events.id,
  title: events.title,
  startAt: events.startAt,
  endAt: events.endAt,
  location: events.location,
  description: events.description,
  published: events.published,
};

/** All of a company's events (any state), for the dashboard manager. */
export async function getCompanyEvents(companyId: number): Promise<MerchantEvent[]> {
  try {
    const rows = await getDb()
      .select(selection)
      .from(events)
      .where(eq(events.ownerCompanyId, companyId))
      .orderBy(asc(events.startAt));
    return rows.map(toEvent);
  } catch (err) {
    console.error("getCompanyEvents failed", err);
    return [];
  }
}

export type AdminEvent = {
  id: number;
  title: string;
  type: string;
  ownerCompanyId: number | null;
  ownerName: string | null;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  description: string | null;
  published: boolean;
};

/** Every event (association + business) for the admin events manager. */
export async function getAllEventsAdmin(): Promise<AdminEvent[]> {
  try {
    const rows = await getDb()
      .select({
        id: events.id,
        title: events.title,
        type: events.type,
        ownerCompanyId: events.ownerCompanyId,
        ownerName: companies.name,
        startAt: events.startAt,
        endAt: events.endAt,
        location: events.location,
        description: events.description,
        published: events.published,
      })
      .from(events)
      .leftJoin(companies, eq(companies.id, events.ownerCompanyId))
      .orderBy(asc(events.startAt));
    return rows.map((r) => ({
      ...r,
      startAt: r.startAt ? r.startAt.toISOString() : null,
      endAt: r.endAt ? r.endAt.toISOString() : null,
    }));
  } catch (err) {
    console.error("getAllEventsAdmin failed", err);
    return [];
  }
}

/** Published, not-past events for the merchant whose slug is given (public page). */
export async function getPublicEventsForCompanySlug(
  slug: string,
): Promise<MerchantEvent[]> {
  try {
    const db = getDb();
    const [c] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(and(eq(companies.slug, slug), eq(companies.published, true)))
      .limit(1);
    if (!c) return [];
    // Keep events that haven't finished — start today or later (12h grace).
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const rows = await db
      .select(selection)
      .from(events)
      .where(
        and(
          eq(events.ownerCompanyId, c.id),
          eq(events.published, true),
          or(isNull(events.startAt), gte(events.startAt, cutoff)),
        ),
      )
      .orderBy(asc(events.startAt));
    return rows.map(toEvent);
  } catch (err) {
    console.error("getPublicEventsForCompanySlug failed", err);
    return [];
  }
}
