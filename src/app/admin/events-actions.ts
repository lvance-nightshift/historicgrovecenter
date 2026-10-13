"use server";

/*
 * Admin event mutations — any event (association or business). Admin-gated.
 */

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { events, mediaAttachments } from "@/db/schema";
import { getActor, isAdmin } from "@/lib/auth/authorize";
import { normalizeSponsors, type Sponsor } from "@/lib/sponsors";
import { getEventGallery, type EventGalleryImage } from "@/lib/events-db";

async function assertAdmin() {
  const actor = await getActor();
  if (!actor || !isAdmin(actor)) throw new Error("Forbidden");
}

export type AdminEventInput = {
  title: string;
  type: "association" | "business";
  ownerCompanyId?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  location?: string;
  description?: string;
  published?: boolean;
  ticketUrl?: string;
  vendorRegistration?: boolean;
  foodRegistration?: boolean;
  boothFee?: string; // dollars, e.g. "45" or "45.00"; blank = no fee
  paymentUrl?: string; // hosted checkout link (Square, etc.); blank = none
  notifyEmails?: string; // who gets registration emails (comma-separated); blank = default
};

function clean(v?: string): string | null {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}
function url(v?: string): string | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
/** Parse a dollar amount ("45", "$45.00") to integer cents; blank/invalid → null. */
function feeCents(v?: string): number | null {
  const t = (v ?? "").replace(/[$,\s]/g, "").trim();
  if (!t) return null;
  const dollars = Number(t);
  if (!Number.isFinite(dollars) || dollars < 0) return null;
  return Math.round(dollars * 100);
}
function toDate(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function slugify(title: string): string {
  const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
  return `${base || "event"}-${Math.random().toString(36).slice(2, 7)}`;
}

function revalidate() {
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
}

export async function adminCreateEvent(input: AdminEventInput): Promise<number> {
  await assertAdmin();
  const title = input.title.trim();
  if (!title) throw new Error("Event title is required.");
  const [row] = await getDb()
    .insert(events)
    .values({
      slug: slugify(title),
      title,
      type: input.type,
      ownerCompanyId: input.type === "business" ? (input.ownerCompanyId ?? null) : null,
      startAt: toDate(input.startAt),
      endAt: toDate(input.endAt),
      location: clean(input.location),
      description: clean(input.description),
      published: input.published ?? true,
      ticketUrl: url(input.ticketUrl),
      vendorAppsOpen: input.vendorRegistration ?? false,
      foodAppsOpen: input.foodRegistration ?? false,
      boothFeeCents: feeCents(input.boothFee),
      paymentUrl: url(input.paymentUrl),
      notifyEmails: clean(input.notifyEmails),
    })
    .returning({ id: events.id });
  revalidate();
  return row.id;
}

export async function adminUpdateEvent(id: number, input: AdminEventInput): Promise<void> {
  await assertAdmin();
  const title = input.title.trim();
  if (!title) throw new Error("Event title is required.");
  await getDb()
    .update(events)
    .set({
      title,
      type: input.type,
      ownerCompanyId: input.type === "business" ? (input.ownerCompanyId ?? null) : null,
      startAt: toDate(input.startAt),
      endAt: toDate(input.endAt),
      location: clean(input.location),
      description: clean(input.description),
      published: input.published ?? true,
      ticketUrl: url(input.ticketUrl),
      vendorAppsOpen: input.vendorRegistration ?? false,
      foodAppsOpen: input.foodRegistration ?? false,
      boothFeeCents: feeCents(input.boothFee),
      paymentUrl: url(input.paymentUrl),
      notifyEmails: clean(input.notifyEmails),
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));
  revalidate();
}

export async function adminDeleteEvent(id: number): Promise<void> {
  await assertAdmin();
  await getDb().delete(events).where(eq(events.id, id));
  revalidate();
}

/** Set (or clear) an event's graphic/hero image. */
export async function setEventHero(id: number, mediaId: number | null): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(events)
    .set({ heroMediaId: mediaId, updatedAt: new Date() })
    .where(eq(events.id, id));
  revalidate();
}

/** Add an image to an event's gallery (extra images shown on the event page). */
export async function addEventGalleryImage(
  eventId: number,
  mediaId: number,
): Promise<EventGalleryImage[]> {
  await assertAdmin();
  // Append after any existing gallery images.
  const [{ next }] = await getDb()
    .select({
      next: sql<number>`coalesce(max(${mediaAttachments.sortOrder}), -1) + 1`,
    })
    .from(mediaAttachments)
    .where(
      and(
        eq(mediaAttachments.targetType, "event"),
        eq(mediaAttachments.targetId, eventId),
        eq(mediaAttachments.purpose, "gallery"),
      ),
    );
  await getDb().insert(mediaAttachments).values({
    mediaId,
    targetType: "event",
    targetId: eventId,
    purpose: "gallery",
    sortOrder: next ?? 0,
  });
  revalidate();
  return getEventGallery(eventId);
}

/** Remove one gallery image (by its attachment row id). */
export async function removeEventGalleryImage(
  eventId: number,
  attachmentId: number,
): Promise<EventGalleryImage[]> {
  await assertAdmin();
  await getDb().delete(mediaAttachments).where(eq(mediaAttachments.id, attachmentId));
  revalidate();
  return getEventGallery(eventId);
}

/** Replace an event's "Our Sponsors" list (full list each call). */
export async function setEventSponsors(
  id: number,
  sponsors: Sponsor[],
): Promise<void> {
  await assertAdmin();
  const clean = normalizeSponsors(sponsors);
  await getDb()
    .update(events)
    .set({ sponsors: clean, updatedAt: new Date() })
    .where(eq(events.id, id));
  revalidate();
}
