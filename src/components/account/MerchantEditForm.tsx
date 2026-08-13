"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { updateMyCompany } from "@/app/account/actions";

// contentEditable editor → client-only.
const RichTextEditor = dynamic(
  () => import("@/components/account/RichTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />
    ),
  },
);
import HoursEditor from "@/components/account/HoursEditor";
import MerchantMediaManager from "@/components/account/MerchantMediaManager";
import type { WeekHours } from "@/lib/hours";
import type { EditableCompany } from "@/lib/account";

const input =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";
const label = "block text-sm";
const labelText = "font-medium text-foreground";

export default function MerchantEditForm({
  company,
  categoryOptions,
}: {
  company: EditableCompany;
  categoryOptions: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markDirty = () => {
    setDirty(true);
    setSaved(false);
  };

  const [f, setF] = useState({
    name: company.name ?? "",
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
  const [categories, setCategories] = useState<string[]>(company.categories ?? []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    markDirty();
  };

  const toggleCategory = (c: string) => {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
    markDirty();
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
        await updateMyCompany({ companyId: company.id, ...f, categories, hoursByDay });
        setSaved(true);
        setDirty(false);
        router.refresh();
      } catch {
        setError("Could not save. Please try again.");
      }
    });
  }

  return (
      <form onSubmit={submit} className="space-y-4">
        {/* Logo + photos (upload/remove immediately — not part of Save) */}
        <MerchantMediaManager
          companyId={company.id}
          initialLogo={company.logo}
          initialGallery={company.gallery}
        />

        <label className={label}>
          <span className={labelText}>Business name</span>
          <input value={f.name} onChange={set("name")} className={input} />
        </label>

        <div className={label}>
          <span className={labelText}>
            Categories <span className="text-muted">(choose any that fit)</span>
          </span>
          <div className="mt-1 flex flex-wrap gap-2">
            {categoryOptions.map((c) => {
              const on = categories.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    on
                      ? "bg-grove text-background"
                      : "border border-border bg-background text-foreground/70 hover:border-grove/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <label className={label}>
          <span className={labelText}>Tagline</span>
          <input
            value={f.tagline}
            onChange={set("tagline")}
            placeholder="One short line about your business"
            className={input}
          />
        </label>

        <div className={label}>
          <span className={labelText}>Description</span>
          <div className="mt-1">
            <RichTextEditor
              value={f.description}
              onChange={(html) => {
                setF((prev) => {
                  if (html !== prev.description) markDirty();
                  return { ...prev, description: html };
                });
              }}
            />
          </div>
        </div>

        <div className={label}>
          <span className={labelText}>Weekly hours</span>
          <div className="mt-1">
            <HoursEditor
              value={hoursByDay}
              onChange={(next) => {
                setHoursByDay(next);
                markDirty();
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
        {saved && !dirty && !pending && (
          <p className="text-sm font-medium text-grove">Saved ✓</p>
        )}

        {/* Floating save — only while there are unsaved changes, so it never
            overlays the rest of the page (e.g. the Events section below). */}
        {(dirty || pending) && (
          <button
            type="submit"
            disabled={pending}
            className={`fixed bottom-6 right-6 z-50 rounded-full px-6 py-3 text-sm font-semibold text-background shadow-lg transition-colors ${
              pending ? "bg-grove" : "bg-brick hover:bg-brick-dark"
            }`}
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        )}
      </form>
  );
}
