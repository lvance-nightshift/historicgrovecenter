import type { Metadata } from "next";
import Link from "next/link";
import { getRegistrationSummary } from "@/lib/events-db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registrations" };

const etDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

function Stat({ n, label, tone }: { n: number; label: string; tone: "grove" | "brick" | "muted" }) {
  const cls =
    tone === "brick"
      ? "bg-brick/15 text-brick-dark"
      : tone === "grove"
        ? "bg-grove/10 text-grove"
        : "bg-border/60 text-muted";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {n} {label}
    </span>
  );
}

export default async function AdminRegistrationsOverview() {
  const summary = await getRegistrationSummary();
  const grandTotal = summary.reduce((s, r) => s + r.total, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-grove">Registrations</h1>
      <p className="mt-1 text-sm text-muted">
        Vendor &amp; food-truck sign-ups across all events
        {grandTotal > 0 ? ` — ${grandTotal} total` : ""}.
      </p>

      {summary.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          No registrations yet. When vendors sign up for an event, they&apos;ll appear here.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {summary.map((r) => (
            <li key={r.eventId}>
              <Link
                href={`/admin/events/${r.eventId}/registrations`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="font-serif text-lg font-semibold text-foreground">
                    {r.eventTitle}
                  </p>
                  <p className="text-sm text-muted">
                    {r.startAt ? etDate.format(new Date(r.startAt)) : "Date TBD"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Stat n={r.total} label="total" tone="grove" />
                  {r.pending > 0 && <Stat n={r.pending} label="pending" tone="brick" />}
                  {r.unpaid > 0 && <Stat n={r.unpaid} label="unpaid" tone="brick" />}
                  <span className="ml-1 text-sm font-medium text-grove">View →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
