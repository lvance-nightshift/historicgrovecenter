"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyCompany } from "@/app/account/actions";
import { CATEGORIES, type Merchant } from "@/lib/merchants";
import MerchantCard from "@/components/MerchantCard";
import HoursEditor from "@/components/account/HoursEditor";
import type { WeekHours } from "@/lib/hours";
import type { EditableCompany } from "@/lib/account";

const input =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";
const label = "block text-sm";
const labelText = "font-medium text-foreground";

export default function MerchantEditForm({ company }: { company: EditableCompany }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    name: company.name ?? "",
    category: company.category ?? "",
    tagline: company.tagline ?? "",
    description: company.description ?? "",
    hours: company.hours ?? "",
    phone: company.phone ?? "",
    website: company.website ?? "",
    address: company.address ?? "",
    facebook: company.facebook ?? "",
    instagram: company.instagram ?? "",
  });
  const [hoursByDay, setHoursByDay] = useState<WeekHours>(company.hoursByDay ?? {});

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    setSaved(false);
  };

  const preview: Merchant = {
    slug: company.slug ?? "preview",
    name: f.name || "Your business name",
    category: f.category || undefined,
    tagline: f.tagline || undefined,
    description: f.description || undefined,
    hours: f.hours || undefined,
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!f.name.trim()) {
      setError("Business name is required.");
      return;
    }
    startTransition(async () => {
      try {
        await updateMyCompany({ companyId: company.id, ...f, hoursByDay });
        setSaved(true);
        router.refresh();
      } catch {
        setError("Could not save. Please try again.");
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={submit} className="space-y-4">
        <label className={label}>
          <span className={labelText}>Business name</span>
          <input value={f.name} onChange={set("name")} className={input} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            <span className={labelText}>Category</span>
            <div className="relative">
              <select
                value={f.category}
                onChange={set("category")}
                className={`${input} appearance-none pr-9`}
              >
                <option value="">— choose —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
              </svg>
            </div>
          </label>
          <label className={label}>
            <span className={labelText}>Tagline</span>
            <input
              value={f.tagline}
              onChange={set("tagline")}
              placeholder="One short line about your business"
              className={input}
            />
          </label>
        </div>

        <label className={label}>
          <span className={labelText}>Description</span>
          <textarea value={f.description} onChange={set("description")} rows={5} className={input} />
        </label>

        <div className={label}>
          <span className={labelText}>Weekly hours</span>
          <div className="mt-1">
            <HoursEditor
              value={hoursByDay}
              onChange={(next) => {
                setHoursByDay(next);
                setSaved(false);
              }}
            />
          </div>
        </div>

        <label className={label}>
          <span className={labelText}>
            Hours note <span className="text-muted">(optional)</span>
          </span>
          <input
            value={f.hours}
            onChange={set("hours")}
            placeholder="e.g. Holiday hours vary · By appointment"
            className={input}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            <span className={labelText}>Phone</span>
            <input value={f.phone} onChange={set("phone")} className={input} />
          </label>
          <label className={label}>
            <span className={labelText}>Website</span>
            <input
              value={f.website}
              onChange={set("website")}
              placeholder="yoursite.com"
              className={input}
            />
          </label>
        </div>

        <label className={label}>
          <span className={labelText}>Address</span>
          <input value={f.address} onChange={set("address")} className={input} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            <span className={labelText}>Facebook</span>
            <input
              value={f.facebook}
              onChange={set("facebook")}
              placeholder="facebook.com/yourpage"
              className={input}
            />
          </label>
          <label className={label}>
            <span className={labelText}>Instagram</span>
            <input
              value={f.instagram}
              onChange={set("instagram")}
              placeholder="instagram.com/yourhandle"
              className={input}
            />
          </label>
        </div>

        {error && <p className="text-sm text-brick-dark">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-grove px-6 py-2.5 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          {saved && !pending && (
            <span className="text-sm font-medium text-grove">Saved ✓</span>
          )}
        </div>
      </form>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Live preview
        </p>
        <div className="pointer-events-none">
          <MerchantCard merchant={preview} />
        </div>
        <p className="mt-2 text-xs text-muted">
          This is how your card appears in the directory. Your full page shows
          everything you enter here.
        </p>
      </aside>
    </div>
  );
}
