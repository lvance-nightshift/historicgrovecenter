/*
 * Business events — data access (server-only).
 *
 * A merchant's own events (type='business', owner_company_id = their company):
 * concerts, sales, workshops, etc. They self-manage these from the dashboard;
 * they show on the merchant's public page.
 */

import "server-only";
import { and, asc, desc, eq, gte, isNotNull, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { companies, events, eventParticipations } from "@/db/schema";
import type { PublicEvent } from "@/lib/events";
import { PUMPKIN_FEST } from "@/lib/pumpkin-fest";

/** Where a "Become a vendor" link points for an event with sign-ups open. */
function registerUrlFor(slug: string, hasApps: boolean): string | undefined {
  if (!hasApps) return undefined;
  // Pumpkin Fest has its own bespoke registration page (1–2 space Square links);
  // everything else uses the generic per-event register form.
  return slug === PUMPKIN_FEST.slug ? "/pumpkin-fest" : `/events/${slug}/register`;
}

export type EventRegistration = {
  id: number;
  type: string;
  status: string;
  feeAmountCents: number | null;
  paymentStatus: string | null;
  permitDocKey: string | null;
  insuranceDocKey: string | null;
  permitVerified: boolean;
  insuranceVerified: boolean;
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
        permitVerified: eventParticipations.permitVerified,
        insuranceVerified: eventParticipations.insuranceVerified,
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
        permitVerified: Boolean(r.permitVerified),
        insuranceVerified: Boolean(r.insuranceVerified),
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
        ticketUrl: events.ticketUrl,
        vendorAppsOpen: events.vendorAppsOpen,
        foodAppsOpen: events.foodAppsOpen,
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
        ticketUrl: r.ticketUrl ?? undefined,
        registerUrl: registerUrlFor(r.slug, r.vendorAppsOpen || r.foodAppsOpen),
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

export type PublicEventDetail = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD (Eastern)
  startTime: string;
  endTime?: string;
  location: string;
  badge: string;
  description: string; // full, untruncated
  ticketUrl?: string;
  registerUrl?: string;
  ownerName?: string;
  ownerSlug?: string;
};

/** A single published, dated event by slug — full detail for /events/[slug]. */
export async function getPublicEventBySlug(
  slug: string,
): Promise<PublicEventDetail | null> {
  try {
    const [r] = await getDb()
      .select({
        slug: events.slug,
        title: events.title,
        type: events.type,
        startAt: events.startAt,
        endAt: events.endAt,
        location: events.location,
        description: events.description,
        ticketUrl: events.ticketUrl,
        vendorAppsOpen: events.vendorAppsOpen,
        foodAppsOpen: events.foodAppsOpen,
        ownerName: companies.name,
        ownerSlug: companies.slug,
      })
      .from(events)
      .leftJoin(companies, eq(companies.id, events.ownerCompanyId))
      .where(and(eq(events.slug, slug), eq(events.published, true), isNotNull(events.startAt)))
      .limit(1);
    if (!r || !r.startAt) return null;
    return {
      slug: r.slug,
      title: r.title,
      date: etDate.format(r.startAt),
      startTime: etTime.format(r.startAt),
      endTime: r.endAt ? etTime.format(r.endAt) : undefined,
      location: r.location ?? "Historic Grove Center",
      badge: r.type === "business" ? r.ownerName ?? "Merchant event" : "Grove Center",
      description: (r.description ?? "").trim(),
      ticketUrl: r.ticketUrl ?? undefined,
      registerUrl: registerUrlFor(r.slug, r.vendorAppsOpen || r.foodAppsOpen),
      ownerName: r.type === "business" ? r.ownerName ?? undefined : undefined,
      ownerSlug: r.type === "business" ? r.ownerSlug ?? undefined : undefined,
    };
  } catch (err) {
    console.error("getPublicEventBySlug failed", err);
    return null;
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
  ticketUrl: string | null;
  vendorAppsOpen: boolean;
  foodAppsOpen: boolean;
  boothFeeCents: number | null;
  paymentUrl: string | null;
  notifyEmails: string | null;
  registrationCount: number;
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
        ticketUrl: events.ticketUrl,
        vendorAppsOpen: events.vendorAppsOpen,
        foodAppsOpen: events.foodAppsOpen,
        boothFeeCents: events.boothFeeCents,
        paymentUrl: events.paymentUrl,
        notifyEmails: events.notifyEmails,
        registrationCount: sql<number>`(SELECT count(*)::int FROM ${eventParticipations} ep WHERE ep.event_id = ${events.id})`,
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

export type RegistrationSummary = {
  eventId: number;
  eventTitle: string;
  startAt: string | null;
  total: number;
  pending: number;
  unpaid: number;
};

/** Per-event registration counts (events that have ≥1 registration), busiest first. */
export async function getRegistrationSummary(): Promise<RegistrationSummary[]> {
  try {
    const rows = await getDb()
      .select({
        eventId: eventParticipations.eventId,
        eventTitle: events.title,
        startAt: events.startAt,
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${eventParticipations.status} = 'pending')::int`,
        unpaid: sql<number>`count(*) filter (where ${eventParticipations.paymentStatus} is distinct from 'paid')::int`,
      })
      .from(eventParticipations)
      .innerJoin(events, eq(events.id, eventParticipations.eventId))
      .groupBy(eventParticipations.eventId, events.title, events.startAt)
      .orderBy(desc(sql`count(*)`));
    return rows.map((r) => ({
      eventId: r.eventId,
      eventTitle: r.eventTitle,
      startAt: r.startAt ? r.startAt.toISOString() : null,
      total: r.total,
      pending: r.pending,
      unpaid: r.unpaid,
    }));
  } catch (err) {
    console.error("getRegistrationSummary failed", err);
    return [];
  }
}

/** Total registrations across all events (for the dashboard card). */
export async function getRegistrationTotal(): Promise<number> {
  try {
    const [row] = await getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(eventParticipations);
    return row?.n ?? 0;
  } catch (err) {
    console.error("getRegistrationTotal failed", err);
    return 0;
  }
}

export type RegisterableEvent = {
  id: number;
  slug: string;
  title: string;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  description: string | null;
  vendorAppsOpen: boolean;
  foodAppsOpen: boolean;
  boothFeeCents: number | null;
  paymentUrl: string | null;
};

/**
 * A published event that is accepting vendor and/or food-truck registrations,
 * by slug. Returns null if the event doesn't exist, isn't published, or has
 * both intake toggles off — the public register page uses this to gate access.
 */
export async function getRegisterableEvent(
  slug: string,
): Promise<RegisterableEvent | null> {
  try {
    const [r] = await getDb()
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        startAt: events.startAt,
        endAt: events.endAt,
        location: events.location,
        description: events.description,
        vendorAppsOpen: events.vendorAppsOpen,
        foodAppsOpen: events.foodAppsOpen,
        boothFeeCents: events.boothFeeCents,
        paymentUrl: events.paymentUrl,
      })
      .from(events)
      .where(
        and(
          eq(events.slug, slug),
          eq(events.published, true),
          or(eq(events.vendorAppsOpen, true), eq(events.foodAppsOpen, true)),
        ),
      )
      .limit(1);
    if (!r) return null;
    return {
      ...r,
      startAt: r.startAt ? r.startAt.toISOString() : null,
      endAt: r.endAt ? r.endAt.toISOString() : null,
    };
  } catch (err) {
    console.error("getRegisterableEvent failed", err);
    return null;
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
