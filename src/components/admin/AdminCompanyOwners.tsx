"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCompanyOwnerByEmail, removeCompanyOwner } from "@/app/admin/actions";

type Owner = { personId: number; name: string; email: string | null };

export default function AdminCompanyOwners({
  companyId,
  initialOwners,
}: {
  companyId: number;
  initialOwners: Owner[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });

  function add() {
    const em = email.trim();
    if (!em) return;
    setError(null);
    run(async () => {
      await addCompanyOwnerByEmail(companyId, em, name);
      setEmail("");
      setName("");
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">Owner / manager</h2>
      <p className="mt-0.5 text-xs text-muted">
        People who can sign in and manage this business&apos;s listing and events.
      </p>

      <ul className="mt-3 space-y-2">
        {initialOwners.length === 0 && (
          <li className="text-sm text-muted">No owner assigned yet.</li>
        )}
        {initialOwners.map((o) => (
          <li
            key={o.personId}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
          >
            <span className="text-sm">
              <span className="font-medium text-foreground">{o.name}</span>
              {o.email && <span className="ml-2 text-muted">{o.email}</span>}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => removeCompanyOwner(companyId, o.personId))}
              className="text-sm text-brick-dark hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-xs">
          <span className="font-medium text-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@example.com"
            className="mt-1 w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-grove"
          />
        </label>
        <label className="text-xs">
          <span className="font-medium text-foreground">Name (optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="mt-1 w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-grove"
          />
        </label>
        <button
          type="button"
          onClick={add}
          disabled={pending || !email.trim()}
          className="rounded-full bg-grove px-4 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-50"
        >
          Add owner
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        If no person with that email exists, one is created and linked. They sign
        in at the bottom of the site with that email.
      </p>
      {error && <p className="mt-1 text-xs text-brick-dark">{error}</p>}
    </div>
  );
}
