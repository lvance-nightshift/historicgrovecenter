import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  companies,
  companyKinds,
  companyKindAssignments,
} from "@/db/schema";
import CompanyCreateForm from "@/components/admin/CompanyCreateForm";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const db = getDb();
  const [rows, kindRows, allKinds] = await Promise.all([
    db.select().from(companies).orderBy(asc(companies.name)).limit(500),
    db
      .select({
        companyId: companyKindAssignments.companyId,
        label: companyKinds.label,
      })
      .from(companyKindAssignments)
      .innerJoin(companyKinds, eq(companyKindAssignments.kindId, companyKinds.id)),
    db
      .select({ id: companyKinds.id, key: companyKinds.key, label: companyKinds.label })
      .from(companyKinds)
      .orderBy(asc(companyKinds.id)),
  ]);

  const kindsByCompany = new Map<number, string[]>();
  for (const k of kindRows) {
    const list = kindsByCompany.get(k.companyId) ?? [];
    list.push(k.label);
    kindsByCompany.set(k.companyId, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-grove">Companies</h1>
      <p className="mt-1 text-sm text-muted">
        {rows.length} {rows.length === 1 ? "company" : "companies"} — merchants, vendors, food trucks, bands, sponsors.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">
              No companies yet. Add one on the right.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-grove/5 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Kinds</th>
                  <th className="px-4 py-2.5 font-medium">Published</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(kindsByCompany.get(c.id) ?? []).map((k) => (
                          <span key={k} className="rounded-full bg-grove/10 px-2 py-0.5 text-xs text-grove">
                            {k}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{c.published ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-serif text-lg font-semibold text-grove">Add a company</h2>
            <CompanyCreateForm kinds={allKinds} />
          </div>
        </aside>
      </div>
    </div>
  );
}
