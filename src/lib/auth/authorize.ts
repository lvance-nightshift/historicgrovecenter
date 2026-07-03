/*
 * Authorization layer — turns an authenticated Better Auth user into an
 * "actor" with real roles from our data model.
 *
 *   Better Auth user (neon_auth.user)
 *        │  resolvePerson()  — find or create, link by email
 *        ▼
 *   person (public.people)
 *        │  role_assignments (global | company | event)
 *        ▼
 *   Actor { user, personId, roles[] }  → check helpers below
 *
 * Bootstrap: any signed-in user whose email is in SUPERADMIN_EMAILS is granted
 * the `developer` role on resolve, so the first admin can get in.
 */

import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { people, roles, roleAssignments } from "@/db/schema";
import { getSessionUser, type SessionUser } from "./session";

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export type RoleScope = "global" | "company" | "event";
export type ActorRole = { key: string; scope: RoleScope; scopeId: number | null };
export type Actor = { user: SessionUser; personId: number; roles: ActorRole[] };

function splitName(name?: string | null): { firstName: string | null; lastName: string | null } {
  const n = (name ?? "").trim();
  if (!n) return { firstName: null, lastName: null };
  const i = n.indexOf(" ");
  return i === -1
    ? { firstName: n, lastName: null }
    : { firstName: n.slice(0, i), lastName: n.slice(i + 1) };
}

/** Find (or create) the person for an authenticated user; link captured people by email. */
async function resolvePersonId(user: SessionUser): Promise<number> {
  const db = getDb();

  const [byUser] = await db.select().from(people).where(eq(people.userId, user.id));
  let personId = byUser?.id;

  if (!personId && user.email) {
    const [byEmail] = await db
      .select()
      .from(people)
      .where(eq(people.email, user.email));
    if (byEmail && !byEmail.userId) {
      await db.update(people).set({ userId: user.id }).where(eq(people.id, byEmail.id));
      personId = byEmail.id;
    }
  }

  if (!personId) {
    const { firstName, lastName } = splitName(user.name);
    const [created] = await db
      .insert(people)
      .values({ userId: user.id, email: user.email ?? null, firstName, lastName })
      .returning({ id: people.id });
    personId = created.id;
  }

  if (user.email && SUPERADMIN_EMAILS.includes(user.email.toLowerCase())) {
    await grantGlobalRole(personId, "developer");
  }

  return personId;
}

/** Idempotently grant a global role by key. */
async function grantGlobalRole(personId: number, roleKey: string): Promise<void> {
  const db = getDb();
  const [role] = await db.select().from(roles).where(eq(roles.key, roleKey));
  if (!role) return;
  const existing = await db
    .select({ id: roleAssignments.id })
    .from(roleAssignments)
    .where(
      and(
        eq(roleAssignments.personId, personId),
        eq(roleAssignments.roleId, role.id),
        eq(roleAssignments.scope, "global"),
      ),
    );
  if (existing.length === 0) {
    await db
      .insert(roleAssignments)
      .values({ personId, roleId: role.id, scope: "global", scopeId: null });
  }
}

/** The current actor (user + person + roles), or null if not signed in. */
export async function getActor(): Promise<Actor | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const personId = await resolvePersonId(user);
  const rows = await getDb()
    .select({
      key: roles.key,
      scope: roleAssignments.scope,
      scopeId: roleAssignments.scopeId,
    })
    .from(roleAssignments)
    .innerJoin(roles, eq(roleAssignments.roleId, roles.id))
    .where(eq(roleAssignments.personId, personId));
  return { user, personId, roles: rows as ActorRole[] };
}

/* ---- Check helpers ---- */
export const hasGlobalRole = (a: Actor, key: string) =>
  a.roles.some((r) => r.scope === "global" && r.key === key);

export const isDeveloper = (a: Actor) => hasGlobalRole(a, "developer");
export const isAssociationAdmin = (a: Actor) => hasGlobalRole(a, "association_admin");
export const isAdmin = (a: Actor) => isDeveloper(a) || isAssociationAdmin(a);

export const rolesForCompany = (a: Actor, companyId: number) =>
  a.roles.filter((r) => r.scope === "company" && r.scopeId === companyId).map((r) => r.key);
export const rolesForEvent = (a: Actor, eventId: number) =>
  a.roles.filter((r) => r.scope === "event" && r.scopeId === eventId).map((r) => r.key);

export const isMerchantOfAny = (a: Actor) =>
  a.roles.some((r) => r.scope === "company" && r.key === "merchant");
export const isCoordinatorOfAny = (a: Actor) =>
  a.roles.some((r) => r.scope === "event" && r.key === "event_coordinator");

/** Can create/edit content (media, listings, event data) somewhere. */
export const canManageContent = (a: Actor) =>
  isAdmin(a) || isMerchantOfAny(a) || isCoordinatorOfAny(a);

/** Can manage a specific company (admins, or a merchant of it). */
export const canManageCompany = (a: Actor, companyId: number) =>
  isAdmin(a) || rolesForCompany(a, companyId).includes("merchant");

/** Can manage a specific event (admins, or its coordinator). */
export const canManageEvent = (a: Actor, eventId: number) =>
  isAdmin(a) || rolesForEvent(a, eventId).includes("event_coordinator");
