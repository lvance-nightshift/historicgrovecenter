"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCompany } from "@/app/admin/actions";

const input =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

export default function CompanyCreateForm({
  kinds,
}: {
  kinds: { id: number; key: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [kindIds, setKindIds] = useState<number[]>([]);

  function toggleKind(id: number) {
    setKindIds((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    startTransition(async () => {
      try {
        await createCompany({ name, tagline, kindIds });
        setName("");
        setTagline("");
        setKindIds([]);
        router.refresh();
      } catch {
        setError("Could not create company.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block text-xs">
        <span className="font-medium text-foreground">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
      </label>
      <label className="block text-xs">
        <span className="font-medium text-foreground">Tagline (optional)</span>
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={input} />
      </label>
      <div className="text-xs">
        <span className="font-medium text-foreground">Kinds</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => toggleKind(k.id)}
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
      </div>
      {error && <p className="text-xs text-brick-dark">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-grove px-4 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add company"}
      </button>
    </form>
  );
}
