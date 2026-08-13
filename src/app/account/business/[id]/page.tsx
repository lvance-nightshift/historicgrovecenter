import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getActor } from "@/lib/auth/authorize";
import { getEditableCompany } from "@/lib/account";
import MerchantEditForm from "@/components/account/MerchantEditForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit listing" };

type Params = { params: Promise<{ id: string }> };

export default async function EditBusinessPage({ params }: Params) {
  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isInteger(companyId)) notFound();

  const actor = await getActor();
  if (!actor) redirect(`/auth/sign-in?returnTo=/account/business/${id}`);

  const company = await getEditableCompany(actor, companyId);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/account" className="text-sm text-grove hover:underline">
        ← My Business
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold text-grove">
          {company.name}
        </h1>
        {company.slug && (
          <Link
            href={`/merchants/${company.slug}`}
            className="text-sm font-medium text-grove hover:underline"
          >
            View live page ↗
          </Link>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">
        Changes you save here go live on your page right away.
      </p>

      <div className="mt-8">
        <MerchantEditForm company={company} />
      </div>
    </div>
  );
}
