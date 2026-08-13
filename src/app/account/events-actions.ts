"use server";

/*
 * Merchant self-service EVENT actions. A merchant manages their own business
 * events (type='business', owner_company_id = their company). Gated by
 * canManageCompany; admins can manage any. Events are published on create
 * (always-live) with a hide/show toggle.
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { companies, events } from "@/db/schema";
import { getActor, canManageCompany } from "@/lib/auth/authorize";

export type MerchantEventInput = {
  title: string;
  startAt?: string | null; // ISO
  endAt?: string | null; // ISO
  location?: string;
  description?: string;
  published?: boolean;
};

function clean(v?: string): string | null {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

function toDate(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "event"}-${suffix}`;
}

async function revalidateForCompany(companyId: number) {
  revalidatePath("/events");
  revalidatePath(`/account/business/${companyId}`);
  const [c] = await getDb()
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, companyId));
  if (c?.slug) revalidatePath(`/merchants/${c.slug}`);
}

/** Load an event's owning company and assert the actor may manage it. */
async function ownerCompanyIdFor(eventId: number): Promise<number> {
  const actor = await getActor();
  if (!actor) throw new Error("Forbidden");
  const [ev] = await getDb()
    .select({ companyId: events.ownerCompanyId })
    .from(events)
    .where(eq(events.id, eventId));
  if (!ev?.companyId || !canManageCompany(actor, ev.companyId)) {
    throw new Error("Forbidden");
  }
  return ev.companyId;
}

export async function createMerchantEvent(
  companyId: number,
  input: MerchantEventInput,
): Promise<number> {
  const actor = await getActor();
  if (!actor || !canManageCompany(actor, companyId)) throw new Error("Forbidden");
  const title = input.title.trim();
  if (!title) throw new Error("Event title is required.");

  const [row] = await getDb()
    .insert(events)
    .values({
      slug: slugify(title),
      title,
      type: "business",
      ownerCompanyId: companyId,
      startAt: toDate(input.startAt),
      endAt: toDate(input.endAt),
      location: clean(input.location),
      description: clean(input.description),
      published: input.published ?? true,
    })
    .returning({ id: events.id });
  await revalidateForCompany(companyId);
  return row.id;
}

export async function updateMerchantEvent(
  eventId: number,
  input: MerchantEventInput,
): Promise<void> {
  const companyId = await ownerCompanyIdFor(eventId);
  const title = input.title.trim();
  if (!title) throw new Error("Event title is required.");
  await getDb()
    .update(events)
    .set({
      title,
      startAt: toDate(input.startAt),
      endAt: toDate(input.endAt),
      location: clean(input.location),
      description: clean(input.description),
      published: input.published ?? true,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));
  await revalidateForCompany(companyId);
}

export async function setMerchantEventPublished(
  eventId: number,
  published: boolean,
): Promise<void> {
  const companyId = await ownerCompanyIdFor(eventId);
  await getDb()
    .update(events)
    .set({ published, updatedAt: new Date() })
    .where(eq(events.id, eventId));
  await revalidateForCompany(companyId);
}

export async function deleteMerchantEvent(eventId: number): Promise<void> {
  const companyId = await ownerCompanyIdFor(eventId);
  await getDb().delete(events).where(eq(events.id, eventId));
  await revalidateForCompany(companyId);
}
