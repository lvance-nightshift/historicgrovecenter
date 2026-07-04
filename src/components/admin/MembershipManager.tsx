"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMembership, removeMembership } from "@/app/admin/actions";

type Membership = {
  id: number;
  companyId: number;
  title: string | null;
  companyName: string;
};

const field =
  "mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-grove";

export default function MembershipManager({
  personId,
  memberships,
  companies,
}: {
  personId: number;
  memberships: Membership[];
  companies: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [companyId, setCompanyId] = useState<number>(companies[0]?.id ?? 0);
  const [title, setTitle] = useState("");

  function add() {
    if (!companyId) return;
    startTransition(async () => {
      await addMembership({ personId, companyId, title });
      setTitle("");
      router.refresh();
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      await removeMembership(id, personId);
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      {companies.length === 0 ? (
        <p className="text-sm text-muted">
          No companies exist yet — create one under Companies first.
        </p>
      ) : (
        <>
          {memberships.length === 0 ? (
            <p className="text-sm text-muted">Not linked to any company.</p>
          ) : (
            <ul className="space-y-2">
              {memberships.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium text-foreground">{m.companyName}</span>
                    {m.title && <span className="ml-2 text-xs text-muted">{m.title}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    disabled={pending}
                    className="text-xs text-brick-dark hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3">
            <label className="block flex-1 text-xs">
              <span className="font-medium text-foreground">Company</span>
              <select
                className={field}
                value={companyId}
                onChange={(e) => setCompanyId(Number(e.target.value))}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block flex-1 text-xs">
              <span className="font-medium text-foreground">Title (optional)</span>
              <input
                className={field}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Owner, Manager…"
              />
            </label>
            <button
              type="button"
              onClick={add}
              disabled={pending}
              className="rounded-full bg-grove px-4 py-1.5 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60"
            >
              Link
            </button>
          </div>
        </>
      )}
    </div>
  );
}
