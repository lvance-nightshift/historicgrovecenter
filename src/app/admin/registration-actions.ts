"use server";

/*
 * Admin edits to a registration (event_participation) — fix inaccurate info or
 * a wrong attachment. Admin-gated.
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { eventParticipations } from "@/db/schema";
import { getActor, isAdmin } from "@/lib/auth/authorize";
import { PUMPKIN_FEST } from "@/lib/pumpkin-fest";

async function assertAdmin() {
  const actor = await getActor();
  if (!actor || !isAdmin(actor)) throw new Error("Forbidden");
}

export type RegistrationEdit = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  products: string;
  spaces: number;
  notes?: string;
  status: string;
  paymentStatus: string;
  permitDocKey?: string;
  insuranceDocKey?: string;
  permitVerified?: boolean;
  insuranceVerified?: boolean;
};

const clean = (v?: string) => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

export async function updateRegistration(
  id: number,
  input: RegistrationEdit,
): Promise<void> {
  await assertAdmin();
  const db = getDb();

  const [row] = await db
    .select({ data: eventParticipations.applicationData, eventId: eventParticipations.eventId })
    .from(eventParticipations)
    .where(eq(eventParticipations.id, id));
  if (!row) throw new Error("Not found");

  const prev = (row.data ?? {}) as Record<string, unknown>;
  let spaces = Number(input.spaces);
  if (!Number.isFinite(spaces) || spaces < 1) spaces = 1;
  if (spaces > 10) spaces = 10;

  await db
    .update(eventParticipations)
    .set({
      status: input.status as never,
      paymentStatus: clean(input.paymentStatus),
      feeAmountCents: spaces * PUMPKIN_FEST.boothFeeCents,
      permitDocKey: clean(input.permitDocKey),
      insuranceDocKey: clean(input.insuranceDocKey),
      permitVerified: Boolean(input.permitVerified),
      insuranceVerified: Boolean(input.insuranceVerified),
      notes: clean(input.notes),
      applicationData: {
        ...prev,
        businessName: input.businessName.trim(),
        contactName: input.contactName.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        products: input.products.trim(),
        spaces,
        notes: clean(input.notes),
      },
      updatedAt: new Date(),
    })
    .where(eq(eventParticipations.id, id));

  revalidatePath(`/admin/events/${row.eventId}/registrations`);
}

/** Quick toggle: mark a permit / insurance as verified (or not). */
export async function setRegistrationVerification(
  id: number,
  field: "permitVerified" | "insuranceVerified",
  value: boolean,
): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const [row] = await db
    .select({ eventId: eventParticipations.eventId })
    .from(eventParticipations)
    .where(eq(eventParticipations.id, id));
  await db
    .update(eventParticipations)
    .set({ [field]: value, updatedAt: new Date() })
    .where(eq(eventParticipations.id, id));
  if (row) revalidatePath(`/admin/events/${row.eventId}/registrations`);
}

export async function deleteRegistration(id: number): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const [row] = await db
    .select({ eventId: eventParticipations.eventId })
    .from(eventParticipations)
    .where(eq(eventParticipations.id, id));
  await db.delete(eventParticipations).where(eq(eventParticipations.id, id));
  if (row) revalidatePath(`/admin/events/${row.eventId}/registrations`);
}
