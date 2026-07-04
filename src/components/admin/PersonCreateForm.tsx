"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPerson } from "@/app/admin/actions";

const input =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

export default function PersonCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const id = await createPerson({ firstName, lastName, email, phone });
        router.push(`/admin/people/${id}`);
      } catch {
        setError("Could not create person.");
      }
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
      {error && <p className="text-xs text-brick-dark">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-grove px-4 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add person"}
      </button>
    </form>
  );
}
