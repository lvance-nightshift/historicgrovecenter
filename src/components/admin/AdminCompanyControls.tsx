"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setCompanyPublished,
  setCompanyKinds,
  deleteCompany,
} from "@/app/admin/actions";

export default function AdminCompanyControls({
  companyId,
  initialPublished,
  allKinds,
  initialKindIds,
}: {
  companyId: number;
  initialPublished: boolean;
  allKinds: { id: number; label: string }[];
  initialKindIds: number[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [published, setPublished] = useState(initialPublished);
  const [kindIds, setKindIds] = useState<number[]>(initialKindIds);

  function togglePublish() {
    const next = !published;
    setPublished(next);
    startTransition(async () => {
      await setCompanyPublished(companyId, next);
      router.refresh();
    });
  }

  function toggleKind(id: number) {
    const next = kindIds.includes(id) ? kindIds.filter((x) => x !== id) : [...kindIds, id];
    setKindIds(next);
    startTransition(() => setCompanyKinds(companyId, next));
  }

  function del() {
    if (!confirm("Delete this company permanently? This can't be undone.")) return;
    startTransition(async () => {
      await deleteCompany(companyId);
      router.push("/admin/companies");
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Visibility</span>
          <button
            type="button"
            onClick={togglePublish}
            disabled={pending}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              published
                ? "bg-grove text-background hover:bg-grove-dark"
                : "border border-border bg-background text-muted hover:border-grove/40"
            }`}
          >
            {published ? "Published" : "Hidden"}
          </button>
          <span className="text-xs text-muted">
            {published ? "Live in the public directory." : "Not shown publicly."}
          </span>
        </div>
        <button
          type="button"
          onClick={del}
          disabled={pending}
          className="rounded-full border border-brick/40 px-4 py-1.5 text-sm font-semibold text-brick-dark hover:bg-brick/10 disabled:opacity-60"
        >
          Delete company
        </button>
      </div>

      <div className="mt-4">
        <span className="text-sm font-medium text-foreground">Kinds</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {allKinds.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => toggleKind(k.id)}
              disabled={pending}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                kindIds.includes(k.id)
                  ? "bg-grove text-background"
                  : "border border-border bg-background text-foreground/70 hover:border-grove/40"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          A company needs the <strong>Merchant</strong> kind to appear in the
          public merchant directory.
        </p>
      </div>
    </div>
  );
}
