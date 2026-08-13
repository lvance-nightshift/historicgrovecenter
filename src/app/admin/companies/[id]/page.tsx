import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { companyKinds, companyKindAssignments } from "@/db/schema";
import { getActor } from "@/lib/auth/authorize";
import { getEditableCompany } from "@/lib/account";
import { getCompanyEvents } from "@/lib/events-db";
import { getCategoryNames } from "@/lib/categories";
import MerchantEditForm from "@/components/account/MerchantEditForm";
import MerchantEventsManager from "@/components/account/MerchantEventsManager";
import AdminCompanyControls from "@/components/admin/AdminCompanyControls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit company" };

type Params = { params: Promise<{ id: string }> };

export default async function AdminCompanyEditPage({ params }: Params) {
  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isInteger(companyId)) notFound();

  const actor = await getActor();
  if (!actor) notFound();
  const company = await getEditableCompany(actor, companyId);
  if (!company) notFound();

  const db = getDb();
  const [events, categoryOptions, allKinds, currentKinds] = await Promise.all([
    getCompanyEvents(companyId),
    getCategoryNames(),
    db
      .select({ id: companyKinds.id, label: companyKinds.label })
      .from(companyKinds)
      .orderBy(asc(companyKinds.id)),
    db
      .select({ kindId: companyKindAssignments.kindId })
      .from(companyKindAssignments)
      .where(eq(companyKindAssignments.companyId, companyId)),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/admin/companies" className="text-sm text-grove hover:underline">
        ← Companies
      </Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-grove">
        {company.name}
      </h1>
      {company.slug && (
        <Link
          href={`/merchants/${company.slug}`}
          className="text-sm font-medium text-grove hover:underline"
        >
          View public page ↗
        </Link>
      )}

      <div className="mt-6">
        <AdminCompanyControls
          companyId={company.id}
          initialPublished={company.published}
          allKinds={allKinds}
          initialKindIds={currentKinds.map((k) => k.kindId)}
        />
      </div>

      <div className="mt-8">
        <MerchantEditForm company={company} categoryOptions={categoryOptions} />
      </div>

      <section className="mt-14 border-t border-border pt-10">
        <h2 className="font-serif text-2xl font-semibold text-grove">Events</h2>
        <p className="mt-1 text-sm text-muted">
          Business events for this company (also editable by the merchant).
        </p>
        <div className="mt-5">
          <MerchantEventsManager companyId={company.id} initialEvents={events} />
        </div>
      </section>
    </div>
  );
}
