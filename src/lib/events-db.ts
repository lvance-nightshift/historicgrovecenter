/*
 * Business events — data access (server-only).
 *
 * A merchant's own events (type='business', owner_company_id = their company):
 * concerts, sales, workshops, etc. They self-manage these from the dashboard;
 * they show on the merchant's public page.
 */

import "server-only";
import { and, asc, eq, gte, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { companies, events } from "@/db/schema";

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
