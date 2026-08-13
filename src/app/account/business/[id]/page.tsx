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
        <div className="flex items-center gap-3 text-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              company.published
                ? "bg-grove/10 text-grove"
                : "bg-brass/20 text-brick-dark"
            }`}
          >
            {company.published ? "Live" : "Pending review"}
          </span>
          {company.published && company.slug && (
            <Link
              href={`/merchants/${company.slug}`}
              className="font-medium text-grove hover:underline"
            >
              View live page ↗
            </Link>
          )}
        </div>
      </div>
      {!company.published && (
        <p className="mt-2 rounded-lg bg-brass/10 px-4 py-2.5 text-sm text-brick-dark">
          Your listing isn&apos;t public yet — a Grove Center admin will review
          and publish it. You can fill everything in now; it&apos;ll go live the
          moment it&apos;s approved, and edits after that publish instantly.
        </p>
      )}

      <div className="mt-8">
        <MerchantEditForm company={company} />
      </div>
    </div>
  );
}
