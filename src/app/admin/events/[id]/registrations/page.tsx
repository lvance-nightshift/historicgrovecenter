import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { getEventRegistrations } from "@/lib/events-db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registrations" };

type Params = { params: Promise<{ id: string }> };

function typeLabel(t: string): string {
  return t === "food_vendor"
    ? "Food"
    : t === "vendor"
      ? "Craft"
      : t.replace("_", " ");
}

export default async function RegistrationsPage({ params }: Params) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();

  const [ev] = await getDb()
    .select({ title: events.title })
    .from(events)
    .where(eq(events.id, eventId));
  if (!ev) notFound();

  const regs = await getEventRegistrations(eventId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/admin/events" className="text-sm text-grove hover:underline">
        ← Events
      </Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-grove">
        {ev.title} — registrations
      </h1>
      <p className="mt-1 text-sm text-muted">
        {regs.length} {regs.length === 1 ? "submission" : "submissions"} from the
        public forms.
      </p>

      {regs.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          No registrations yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {regs.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-lg font-semibold text-foreground">
                    {r.businessName || "(no name)"}
                    <span className="ml-2 rounded-full bg-grove/10 px-2 py-0.5 text-xs font-medium text-grove">
                      {typeLabel(r.type)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {r.contactName}
                    {r.email && (
                      <>
                        {" · "}
                        <a href={`mailto:${r.email}`} className="text-grove hover:underline">
                          {r.email}
                        </a>
                      </>
                    )}
                    {r.phone && ` · ${r.phone}`}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium text-foreground">
                    {r.spaces ?? 1} space{(r.spaces ?? 1) > 1 ? "s" : ""}
                    {r.feeAmountCents != null && ` · $${(r.feeAmountCents / 100).toFixed(0)}`}
                  </p>
                  <p className="text-xs text-muted">
                    {r.status}
                    {r.paymentStatus ? ` · ${r.paymentStatus}` : ""}
                  </p>
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

              {(r.permitDocKey || r.insuranceDocKey) && (
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  {r.permitDocKey && (
                    <a
                      href={`/api/admin/doc?key=${encodeURIComponent(r.permitDocKey)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-grove hover:underline"
                    >
                      View permit ↗
                    </a>
                  )}
                  {r.insuranceDocKey && (
                    <a
                      href={`/api/admin/doc?key=${encodeURIComponent(r.insuranceDocKey)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-grove hover:underline"
                    >
                      View insurance ↗
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
