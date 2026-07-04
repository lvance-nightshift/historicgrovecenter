import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { people } from "@/db/schema";
import PersonCreateForm from "@/components/admin/PersonCreateForm";

export const dynamic = "force-dynamic";

function fullName(p: { firstName: string | null; lastName: string | null }) {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "(no name)";
}

export default async function PeoplePage() {
  const rows = await getDb()
    .select()
    .from(people)
    .orderBy(desc(people.createdAt))
    .limit(500);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-grove">People</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} {rows.length === 1 ? "person" : "people"} — contacts, staff, merchants, and friends.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">
              No people yet. Add one on the right.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-grove/5 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-grove/5">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      <Link href={`/admin/people/${p.id}`} className="hover:text-grove hover:underline">
                        {fullName(p)}
                      </Link>
                      {p.userId && (
                        <span className="ml-2 rounded-full bg-grove/10 px-1.5 py-0.5 text-[0.65rem] text-grove">
                          account
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{p.email ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted">{p.phone ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/admin/people/${p.id}`} className="text-grove hover:underline">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-serif text-lg font-semibold text-grove">Add a person</h2>
            <PersonCreateForm />
          </div>
        </aside>
      </div>
    </div>
  );
}
