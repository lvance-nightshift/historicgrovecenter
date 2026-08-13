"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
} from "@/app/admin/events-actions";
import type { AdminEvent } from "@/lib/events-db";
import { isoToEtLocalInput, etLocalInputToIso } from "@/lib/datetime";

const input =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

type Company = { id: number; name: string };
type Form = {
  title: string;
  type: "association" | "business";
  ownerCompanyId: string;
  start: string;
  end: string;
  location: string;
  description: string;
  published: boolean;
  ticketUrl: string;
  vendorRegistration: boolean;
  foodRegistration: boolean;
  boothFee: string; // dollars per space; blank = free
};

const blank: Form = {
  title: "",
  type: "association",
  ownerCompanyId: "",
  start: "",
  end: "",
  location: "",
  description: "",
  published: true,
  ticketUrl: "",
  vendorRegistration: false,
  foodRegistration: false,
  boothFee: "",
};

function formatWhen(iso: string | null): string {
  if (!iso) return "Date TBD";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Date TBD";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminEventsManager({
  initialEvents,
  companies,
}: {
  initialEvents: AdminEvent[];
  companies: Company[];
}) {
  const [items, setItems] = useState<AdminEvent[]>(initialEvents);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const ownerName = (id: number | null) =>
    id == null ? null : companies.find((c) => c.id === id)?.name ?? null;

  function openNew() {
    setForm(blank);
    setEditing("new");
    setError(null);
  }
  function openEdit(e: AdminEvent) {
    setForm({
      title: e.title,
      type: e.type === "business" ? "business" : "association",
      ownerCompanyId: e.ownerCompanyId ? String(e.ownerCompanyId) : "",
      start: isoToEtLocalInput(e.startAt),
      end: isoToEtLocalInput(e.endAt),
      location: e.location ?? "",
      description: e.description ?? "",
      published: e.published,
      ticketUrl: e.ticketUrl ?? "",
      vendorRegistration: e.vendorAppsOpen,
      foodRegistration: e.foodAppsOpen,
      boothFee: e.boothFeeCents != null ? String(e.boothFeeCents / 100) : "",
    });
    setEditing(e.id);
    setError(null);
  }

  const payload = () => ({
    title: form.title,
    type: form.type,
    ownerCompanyId:
      form.type === "business" && form.ownerCompanyId ? Number(form.ownerCompanyId) : null,
    startAt: etLocalInputToIso(form.start),
    endAt: etLocalInputToIso(form.end),
    location: form.location,
    description: form.description,
    published: form.published,
    ticketUrl: form.ticketUrl,
    vendorRegistration: form.vendorRegistration,
    foodRegistration: form.foodRegistration,
    boothFee: form.boothFee,
  });

  const feeToCents = (v: string): number | null => {
    const t = v.replace(/[$,\s]/g, "").trim();
    if (!t) return null;
    const d = Number(t);
    return Number.isFinite(d) && d >= 0 ? Math.round(d * 100) : null;
  };

  function rowFrom(id: number): AdminEvent {
    const p = payload();
    return {
      id,
      title: p.title,
      type: p.type,
      ownerCompanyId: p.ownerCompanyId,
      ownerName: ownerName(p.ownerCompanyId),
      startAt: p.startAt,
      endAt: p.endAt,
      location: form.location || null,
      description: form.description || null,
      published: p.published,
      ticketUrl: form.ticketUrl || null,
      vendorAppsOpen: form.vendorRegistration,
      foodAppsOpen: form.foodRegistration,
      boothFeeCents: feeToCents(form.boothFee),
    };
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give the event a title.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (editing === "new") {
          const id = await adminCreateEvent(payload());
          setItems((prev) => [...prev, rowFrom(id)].sort(sortByStart));
        } else if (typeof editing === "number") {
          await adminUpdateEvent(editing, payload());
          setItems((prev) => prev.map((it) => (it.id === editing ? rowFrom(editing) : it)).sort(sortByStart));
        }
        setEditing(null);
      } catch {
        setError("Could not save the event. Please try again.");
      }
    });
  }

  function remove(id: number) {
    if (!confirm("Delete this event?")) return;
    startTransition(async () => {
      await adminDeleteEvent(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <div>
              <p className="font-medium text-foreground">
                {e.title}
                <span className="ml-2 rounded-full bg-grove/10 px-2 py-0.5 text-xs text-grove">
                  {e.type === "business" ? "Business" : "Association"}
                </span>
                {!e.published && (
                  <span className="ml-2 rounded-full bg-brass/20 px-2 py-0.5 text-xs text-brick-dark">Hidden</span>
                )}
              </p>
              <p className="text-sm text-muted">
                {formatWhen(e.startAt)}
                {e.ownerName ? ` · ${e.ownerName}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {(e.vendorAppsOpen || e.foodAppsOpen) && (
                <Link href={`/admin/events/${e.id}/registrations`} className="font-medium text-grove hover:underline">
                  Registrations
                </Link>
              )}
              {e.ticketUrl && (
                <a href={e.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-grove">
                  Tickets ↗
                </a>
              )}
              <button type="button" onClick={() => openEdit(e)} className="font-medium text-grove hover:underline">Edit</button>
              <button type="button" onClick={() => remove(e.id)} disabled={busy} className="text-brick-dark hover:underline">Delete</button>
            </div>
          </li>
        ))}
        {items.length === 0 && editing !== "new" && (
          <li className="text-sm text-muted">No events yet.</li>
        )}
      </ul>

      {editing !== null ? (
        <form onSubmit={save} className="space-y-3 rounded-xl border border-border bg-surface p-5">
          <p className="font-serif text-lg font-semibold text-grove">
            {editing === "new" ? "New event" : "Edit event"}
          </p>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Title</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-foreground">Type</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Form["type"] })} className={input}>
                <option value="association">Association</option>
                <option value="business">Business</option>
              </select>
            </label>
            {form.type === "business" && (
              <label className="block text-sm">
                <span className="font-medium text-foreground">Owner business</span>
                <select value={form.ownerCompanyId} onChange={(e) => setForm({ ...form, ownerCompanyId: e.target.value })} className={input}>
                  <option value="">— none —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-foreground">Starts</span>
              <input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className={input} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-foreground">Ends <span className="text-muted">(optional)</span></span>
              <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className={input} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Location <span className="text-muted">(optional)</span></span>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={input} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Details <span className="text-muted">(optional)</span></span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={input} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">
              Ticket link <span className="text-muted">(Eventbrite, etc. — optional)</span>
            </span>
            <input
              value={form.ticketUrl}
              onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })}
              placeholder="https://www.eventbrite.com/e/..."
              className={input}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.vendorRegistration}
              onChange={(e) => setForm({ ...form, vendorRegistration: e.target.checked })}
            />
            <span className="text-foreground/80">
              Takes vendor registrations (shows the Registrations view)
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.foodRegistration}
              onChange={(e) => setForm({ ...form, foodRegistration: e.target.checked })}
            />
            <span className="text-foreground/80">
              Takes food-truck registrations (permit &amp; insurance uploads required)
            </span>
          </label>
          {(form.vendorRegistration || form.foodRegistration) && (
            <label className="block text-sm">
              <span className="font-medium text-foreground">
                Fee per space <span className="text-muted">(optional — leave blank for free)</span>
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-muted">$</span>
                <input
                  value={form.boothFee}
                  onChange={(e) => setForm({ ...form, boothFee: e.target.value })}
                  inputMode="decimal"
                  placeholder="45"
                  className={`${input} mt-0 max-w-[8rem]`}
                />
                <span className="text-sm text-muted">per vendor space</span>
              </div>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            <span className="text-foreground/80">Published</span>
          </label>
          {error && <p className="text-sm text-brick-dark">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className="rounded-full bg-grove px-5 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60">
              {busy ? "Saving…" : "Save event"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm text-muted hover:text-foreground">Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={openNew} className="rounded-full border border-grove/40 px-5 py-2 text-sm font-semibold text-grove hover:bg-grove/10">
          + Add event
        </button>
      )}
    </div>
  );
}

function sortByStart(a: AdminEvent, b: AdminEvent): number {
  const av = a.startAt ? new Date(a.startAt).getTime() : Infinity;
  const bv = b.startAt ? new Date(b.startAt).getTime() : Infinity;
  return av - bv;
}
