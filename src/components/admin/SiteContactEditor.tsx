"use client";

import { useState, useTransition } from "react";
import { updateSiteContact } from "@/app/admin/site/actions";
import type { SiteContact } from "@/lib/site-settings";

const input =
  "mt-1 h-10 w-full box-border rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

export default function SiteContactEditor({ initial }: { initial: SiteContact }) {
  const [form, setForm] = useState<SiteContact>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const set = (k: keyof SiteContact) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateSiteContact(form);
        setSaved(true);
      } catch {
        setError("Could not save. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={save} className="mt-4 space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input type="email" value={form.email} onChange={set("email")} className={input} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">Phone</span>
          <input type="tel" value={form.phone} onChange={set("phone")} className={input} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">Address line 1</span>
          <input value={form.addressLine1} onChange={set("addressLine1")} className={input} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">
            Address line 2 <span className="text-muted">(city, state, ZIP)</span>
          </span>
          <input value={form.addressLine2} onChange={set("addressLine2")} className={input} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">
            Facebook URL <span className="text-muted">(blank to hide)</span>
          </span>
          <input value={form.facebook} onChange={set("facebook")} placeholder="https://facebook.com/…" className={input} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">
            Instagram URL <span className="text-muted">(blank to hide)</span>
          </span>
          <input value={form.instagram} onChange={set("instagram")} placeholder="https://instagram.com/…" className={input} />
        </label>
      </div>

      {error && <p className="text-sm text-brick-dark">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-grove px-5 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save contact info"}
        </button>
        {saved && !busy && <span className="text-sm font-medium text-grove">✓ Saved</span>}
      </div>
    </form>
  );
}
