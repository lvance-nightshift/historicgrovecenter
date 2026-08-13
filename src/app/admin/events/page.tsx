import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { companies } from "@/db/schema";
import { getAllEventsAdmin } from "@/lib/events-db";
import AdminEventsManager from "@/components/admin/AdminEventsManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Events" };

export default async function AdminEventsPage() {
  const [events, companyRows] = await Promise.all([
    getAllEventsAdmin(),
    getDb()
      .select({ id: companies.id, name: companies.name })
      .from(companies)
      .orderBy(asc(companies.name)),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-grove">Events</h1>
      <p className="mt-1 text-sm text-muted">
        Every event — association events (like Pumpkin Fest) and business events.
        Merchants can also manage their own business events from their dashboard.
      </p>
      <div className="mt-8">
        <AdminEventsManager initialEvents={events} companies={companyRows} />
      </div>
    </div>
  );
}
