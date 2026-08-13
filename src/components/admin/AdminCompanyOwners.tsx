"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addCompanyOwnerByEmail,
  removeCompanyOwner,
  sendOwnerInvite,
} from "@/app/admin/actions";

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
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function add() {
    const em = email.trim();
    if (!em) return;
    setError(null);
    setNote(null);
    startTransition(async () => {
      try {
        const personId = await addCompanyOwnerByEmail(companyId, em, name);
        try {
          await sendOwnerInvite(companyId, personId);
          setNote(`Owner added and an invite was emailed to ${em}.`);
        } catch {
          setNote(`Owner added. Invite email couldn't be sent (email not configured?).`);
        }
        setEmail("");
        setName("");
        router.refresh();
      } catch {
        setError("Couldn't add that owner. Please try again.");
      }
    });
  }

  function resend(personId: number, ownerEmail: string | null) {
    setError(null);
    setNote(null);
    startTransition(async () => {
      try {
        await sendOwnerInvite(companyId, personId);
        setNote(`Invite re-sent${ownerEmail ? ` to ${ownerEmail}` : ""}.`);
      } catch {
        setError("Couldn't send the invite email.");
      }
    });
  }

  function remove(personId: number) {
    setError(null);
    setNote(null);
    startTransition(async () => {
      await removeCompanyOwner(companyId, personId);
      router.refresh();
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
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
          >
            <span className="text-sm">
              <span className="font-medium text-foreground">{o.name}</span>
              {o.email && <span className="ml-2 text-muted">{o.email}</span>}
            </span>
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                disabled={pending || !o.email}
                onClick={() => resend(o.personId, o.email)}
                className="font-medium text-grove hover:underline disabled:opacity-50"
              >
                Resend invite
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(o.personId)}
                className="text-brick-dark hover:underline"
              >
                Remove
              </button>
            </div>
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
          Add &amp; invite
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Adds the person (creating them if needed), grants merchant access, and
        emails them a link to set up their account and claim the business.
      </p>
      {note && <p className="mt-1 text-xs text-grove">{note}</p>}
      {error && <p className="mt-1 text-xs text-brick-dark">{error}</p>}
    </div>
  );
}
