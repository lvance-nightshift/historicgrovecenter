import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import { getPublicEventBySlug } from "@/lib/events-db";
import { formatEventDate } from "@/lib/events";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const ev = await getPublicEventBySlug(slug);
  if (!ev) return { title: "Event not found" };
  return {
    title: ev.title,
    description: ev.description ? ev.description.slice(0, 155) : `${ev.title} at Historic Grove Center.`,
  };
}

export default async function EventDetailPage({ params }: Params) {
  const { slug } = await params;
  const ev = await getPublicEventBySlug(slug);
  if (!ev) notFound();

  const d = formatEventDate(ev.date);
  const when = `${d.full}${ev.startTime ? ` · ${ev.startTime}${ev.endTime ? `–${ev.endTime}` : ""}` : ""}`;
  const isVendor = ev.registerUrl && ev.registerUrl !== ev.ticketUrl;

  return (
    <>
      <PageHero eyebrow={ev.badge} title={ev.title} subtitle={when} />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/events" className="text-sm text-grove hover:underline">
          ← All events
        </Link>

        <p className="mt-4 text-sm font-medium text-foreground/70">📍 {ev.location}</p>

        {ev.description && (
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-foreground/85">
            {ev.description}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {ev.ticketUrl && (
            <a
              href={ev.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark"
            >
              Get tickets ↗
            </a>
          )}
          {isVendor && (
            <Link
              href={ev.registerUrl!}
              className="rounded-full border border-grove/40 px-6 py-3 font-semibold text-grove transition-colors hover:bg-grove/10"
            >
              Become a vendor →
            </Link>
          )}
          {ev.ownerSlug && (
            <Link
              href={`/merchants/${ev.ownerSlug}`}
              className="rounded-full border border-grove/40 px-6 py-3 font-semibold text-grove transition-colors hover:bg-grove/10"
            >
              More from {ev.ownerName} →
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
