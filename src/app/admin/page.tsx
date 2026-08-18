import Link from "next/link";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  people,
  companies,
  events,
  contactSubmissions,
  media,
} from "@/db/schema";
import { getRegistrationTotal } from "@/lib/events-db";

export const dynamic = "force-dynamic";

async function tableCount(
  t: typeof people | typeof companies | typeof events | typeof contactSubmissions | typeof media,
): Promise<number> {
  const [row] = await getDb().select({ n: sql<number>`count(*)::int` }).from(t);
  return row?.n ?? 0;
}

export default async function AdminDashboard() {
  const [peopleN, companiesN, eventsN, inboxN, mediaN, registrationsN] = await Promise.all([
    tableCount(people),
    tableCount(companies),
    tableCount(events),
    tableCount(contactSubmissions),
    tableCount(media),
    getRegistrationTotal(),
  ]);

  const cards: {
    href: string;
    label: string;
    hint: string;
    n?: number;
  }[] = [
    { href: "/admin/people", label: "People", n: peopleN, hint: "Contacts, staff, friends" },
    { href: "/admin/companies", label: "Companies", n: companiesN, hint: "Merchants, vendors, bands" },
    { href: "/admin/media", label: "Media", n: mediaN, hint: "Images & documents" },
    { href: "/admin/site", label: "Site", hint: "Hero image, colors & themes" },
    { href: "/admin/events", label: "Events", n: eventsN, hint: "Association & business events" },
    { href: "/admin/registrations", label: "Registrations", n: registrationsN, hint: "Vendor & food-truck sign-ups" },
    { href: "/admin", label: "Inbox", n: inboxN, hint: "Contact submissions" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-grove">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Grove Center administration</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <Link
            key={i}
            href={c.href}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-lg font-semibold text-grove">
                {c.label}
              </span>
              <span className="font-serif text-3xl font-semibold text-brick">
                {typeof c.n === "number" ? c.n : "→"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{c.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
