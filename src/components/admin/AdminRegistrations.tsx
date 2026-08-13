"use client";

import { useState, useTransition } from "react";
import {
  updateRegistration,
  deleteRegistration,
} from "@/app/admin/registration-actions";
import DocUpload from "@/components/DocUpload";
import { PUMPKIN_FEST } from "@/lib/pumpkin-fest";
import type { EventRegistration } from "@/lib/events-db";

const STATUSES = ["pending", "approved", "waitlisted", "rejected", "cancelled"];
const input =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

function typeLabel(t: string) {
  return t === "food_vendor" ? "Food" : t === "vendor" ? "Craft" : t.replace("_", " ");
}

export default function AdminRegistrations({
  registrations,
}: {
  registrations: EventRegistration[];
}) {
  const [items, setItems] = useState(registrations);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function save(e: React.FormEvent<HTMLFormElement>, r: EventRegistration) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => String(fd.get(k) ?? "").trim();
    let spaces = Number(fd.get("spaces") ?? 1);
    if (!Number.isFinite(spaces) || spaces < 1) spaces = 1;
    const edit = {
      businessName: g("businessName"),
      contactName: g("contactName"),
      email: g("email"),
      phone: g("phone"),
      products: g("products"),
      spaces,
      notes: g("notes"),
      status: g("status") || "pending",
      paymentStatus: g("paymentStatus"),
      permitDocKey: g("permitDocKey"),
      insuranceDocKey: g("insuranceDocKey"),
    };
    setError(null);
    startTransition(async () => {
      try {
        await updateRegistration(r.id, edit);
        setItems((prev) =>
          prev.map((it) =>
            it.id === r.id
              ? {
                  ...it,
                  ...edit,
                  notes: edit.notes || null,
                  permitDocKey: edit.permitDocKey || null,
                  insuranceDocKey: edit.insuranceDocKey || null,
                  feeAmountCents: spaces * PUMPKIN_FEST.boothFeeCents,
                }
              : it,
          ),
        );
        setEditingId(null);
      } catch {
        setError("Could not save. Please try again.");
      }
    });
  }

  function remove(id: number) {
    if (!confirm("Delete this registration?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteRegistration(id);
        setItems((prev) => prev.filter((it) => it.id !== id));
      } catch {
        setError("Could not delete. Please try again.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        No registrations yet.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {error && <p className="text-sm text-brick-dark">{error}</p>}
      {items.map((r) => {
        const isFood = r.type === "food_vendor";
        const editing = editingId === r.id;
        return (
          <div key={r.id} className="rounded-xl border border-border bg-surface p-5">
            {!editing ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg font-semibold text-foreground">
                      {r.businessName || "(no name)"}
                      <span className="ml-2 rounded-full bg-grove/10 px-2 py-0.5 text-xs font-medium text-grove">
                        {typeLabel(r.type)}
                      </span>
                      <span className="ml-2 rounded-full bg-brass/20 px-2 py-0.5 text-xs text-brick-dark">
                        {r.status}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {r.contactName}
                      {r.email && ` · ${r.email}`}
                      {r.phone && ` · ${r.phone}`}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-foreground">
                      {r.spaces ?? 1} space{(r.spaces ?? 1) > 1 ? "s" : ""}
                      {r.feeAmountCents != null && ` · $${(r.feeAmountCents / 100).toFixed(0)}`}
                    </p>
                    <p className="text-xs text-muted">{r.paymentStatus ?? "unpaid"}</p>
                  </div>
                </div>
                {r.products && (
                  <p className="mt-3 text-sm text-foreground/85">
                    <span className="font-medium">Selling/serving:</span> {r.products}
                  </p>
                )}
                {r.notes && (
                  <p className="mt-1 text-sm text-muted">
                    <span className="font-medium">Notes:</span> {r.notes}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  {isFood && r.permitDocKey && (
                    <a href={`/api/admin/doc?key=${encodeURIComponent(r.permitDocKey)}`} target="_blank" rel="noopener noreferrer" className="font-medium text-grove hover:underline">
                      View permit ↗
                    </a>
                  )}
                  {isFood && r.insuranceDocKey && (
                    <a href={`/api/admin/doc?key=${encodeURIComponent(r.insuranceDocKey)}`} target="_blank" rel="noopener noreferrer" className="font-medium text-grove hover:underline">
                      View insurance ↗
                    </a>
                  )}
                  <button type="button" onClick={() => { setEditingId(r.id); setError(null); }} className="ml-auto font-medium text-grove hover:underline">
                    Edit
                  </button>
                  <button type="button" onClick={() => remove(r.id)} disabled={busy} className="text-brick-dark hover:underline">
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={(e) => save(e, r)} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-medium text-foreground">Business</span>
                    <input name="businessName" defaultValue={r.businessName} className={input} />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-foreground">Contact</span>
                    <input name="contactName" defaultValue={r.contactName} className={input} />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-foreground">Email</span>
                    <input name="email" type="email" defaultValue={r.email} className={input} />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-foreground">Phone</span>
                    <input name="phone" defaultValue={r.phone} className={input} />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="font-medium text-foreground">{isFood ? "Serving" : "Selling"}</span>
                  <textarea name="products" defaultValue={r.products} rows={2} className={input} />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block text-sm">
                    <span className="font-medium text-foreground">Spaces</span>
                    <input name="spaces" type="number" min={1} max={10} defaultValue={r.spaces ?? 1} className={input} />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-foreground">Status</span>
                    <select name="status" defaultValue={r.status} className={input}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-foreground">Payment</span>
                    <select name="paymentStatus" defaultValue={r.paymentStatus ?? "unpaid"} className={input}>
                      <option value="unpaid">unpaid</option>
                      <option value="paid">paid</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="font-medium text-foreground">Notes</span>
                  <textarea name="notes" defaultValue={r.notes ?? ""} rows={2} className={input} />
                </label>

                {isFood && (
                  <div className="space-y-3 rounded-lg border border-brass/40 bg-brass/5 p-4">
                    <DocUpload name="permitDocKey" label="Oak Ridge food-service permit" initialKey={r.permitDocKey ?? ""} adminView />
                    <DocUpload name="insuranceDocKey" label="Certificate of liability insurance" initialKey={r.insuranceDocKey ?? ""} adminView />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={busy} className="rounded-full bg-grove px-5 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60">
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-sm text-muted hover:text-foreground">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
