import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { getEventRegistrations } from "@/lib/events-db";
import AdminRegistrations from "@/components/admin/AdminRegistrations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registrations" };

type Params = { params: Promise<{ id: string }> };

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

      <AdminRegistrations registrations={regs} />
    </div>
  );
}
