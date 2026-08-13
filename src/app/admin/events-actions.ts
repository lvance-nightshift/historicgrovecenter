"use server";

/*
 * Admin event mutations — any event (association or business). Admin-gated.
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { getActor, isAdmin } from "@/lib/auth/authorize";

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
