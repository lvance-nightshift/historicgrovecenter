"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePerson } from "@/app/admin/actions";

const input =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

type PersonProps = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  marketingOptIn: boolean;
};

export default function PersonEditForm({ person }: { person: PersonProps }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [firstName, setFirstName] = useState(person.firstName ?? "");
  const [lastName, setLastName] = useState(person.lastName ?? "");
  const [email, setEmail] = useState(person.email ?? "");
  const [phone, setPhone] = useState(person.phone ?? "");
  const [marketingOptIn, setMarketingOptIn] = useState(person.marketingOptIn);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updatePerson(person.id, {
        firstName,
        lastName,
        email,
        phone,
        marketingOptIn,
      });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs">
          <span className="font-medium text-foreground">First name</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} />
        </label>
        <label className="block text-xs">
          <span className="font-medium text-foreground">Last name</span>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} />
        </label>
      </div>
      <label className="block text-xs">
        <span className="font-medium text-foreground">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </label>
      <label className="block text-xs">
        <span className="font-medium text-foreground">Phone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="h-4 w-4 rounded border-border text-grove"
        />
        <span className="text-foreground">Friend of the Grove (marketing opt-in)</span>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-grove px-4 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-grove">Saved ✓</span>}
      </div>
    </form>
  );
}
