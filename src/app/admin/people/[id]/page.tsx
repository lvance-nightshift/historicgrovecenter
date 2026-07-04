import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  people,
  companies,
  events,
  roles,
  roleAssignments,
  companyMemberships,
} from "@/db/schema";
import PersonEditForm from "@/components/admin/PersonEditForm";
import RoleManager from "@/components/admin/RoleManager";
import MembershipManager from "@/components/admin/MembershipManager";

export const dynamic = "force-dynamic";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const db = getDb();
  const [person] = await db.select().from(people).where(eq(people.id, id));
  if (!person) notFound();

  const [roleRows, membershipRows, allRoles, allCompanies, allEvents] =
    await Promise.all([
      db
        .select({
          id: roleAssignments.id,
          scope: roleAssignments.scope,
          scopeId: roleAssignments.scopeId,
          roleKey: roles.key,
          roleLabel: roles.label,
        })
        .from(roleAssignments)
        .innerJoin(roles, eq(roleAssignments.roleId, roles.id))
        .where(eq(roleAssignments.personId, id)),
      db
        .select({
          id: companyMemberships.id,
          companyId: companyMemberships.companyId,
          title: companyMemberships.title,
          companyName: companies.name,
        })
        .from(companyMemberships)
        .innerJoin(companies, eq(companyMemberships.companyId, companies.id))
        .where(eq(companyMemberships.personId, id)),
      db.select({ id: roles.id, key: roles.key, label: roles.label }).from(roles).orderBy(asc(roles.id)),
      db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(asc(companies.name)),
      db.select({ id: events.id, title: events.title }).from(events).orderBy(asc(events.title)),
    ]);

  const companyName = new Map(allCompanies.map((c) => [c.id, c.name]));
  const eventTitle = new Map(allEvents.map((e) => [e.id, e.title]));

  const assignments = roleRows.map((r) => ({
    id: r.id,
    roleKey: r.roleKey,
    roleLabel: r.roleLabel,
    scope: r.scope,
    scopeId: r.scopeId,
    scopeLabel:
      r.scope === "global"
        ? null
        : r.scope === "company"
          ? (companyName.get(r.scopeId ?? -1) ?? `company #${r.scopeId}`)
          : (eventTitle.get(r.scopeId ?? -1) ?? `event #${r.scopeId}`),
  }));

  const displayName =
    [person.firstName, person.lastName].filter(Boolean).join(" ") || "(no name)";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/admin/people" className="text-sm text-grove hover:underline">
        ← People
      </Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-grove">
        {displayName}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {person.email ?? "no email"}
        {person.userId ? " · has login account" : " · no login yet"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-serif text-lg font-semibold text-grove">Details</h2>
          <PersonEditForm person={person} />
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-serif text-lg font-semibold text-grove">Roles</h2>
          <p className="mt-1 text-xs text-muted">
            Grant global roles, or scope them to a company or event.
          </p>
          <RoleManager
            personId={id}
            assignments={assignments}
            roles={allRoles}
            companies={allCompanies}
            events={allEvents}
          />
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="font-serif text-lg font-semibold text-grove">
            Company memberships
          </h2>
          <MembershipManager
            personId={id}
            memberships={membershipRows}
            companies={allCompanies}
          />
        </section>
      </div>
    </div>
  );
}
