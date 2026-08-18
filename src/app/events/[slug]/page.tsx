import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import { getPublicEventBySlug } from "@/lib/events-db";
import { formatEventDate } from "@/lib/events";
import { PUMPKIN_FEST as PF } from "@/lib/pumpkin-fest";

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
          {ev.ticketUrl &&
            (ev.ticketUrl.startsWith("/") ? (
              <Link
                href={ev.ticketUrl}
                className="rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark"
              >
                Register →
              </Link>
            ) : (
              <a
                href={ev.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark"
              >
                Get tickets ↗
              </a>
            ))}
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

        {/* Succulent Pumpkin Workshop — per-session Square registration */}
        {ev.slug === PF.workshop.slug && (
          <div className="mt-8 max-w-lg">
            <p className="text-sm font-medium text-foreground">
              {PF.workshop.priceLabel} · {PF.workshop.slotsLabel}. Choose a session to register:
            </p>
            <div className="mt-3 space-y-2">
              {PF.workshop.sessions.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-medium text-foreground">{s.label}</span>
                  {s.registerUrl ? (
                    <a
                      href={s.registerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full bg-grove px-5 py-2 text-center text-sm font-semibold text-background transition-colors hover:bg-grove-dark"
                    >
                      Register — {PF.workshop.priceLabel} ↗
                    </a>
                  ) : (
                    <span className="shrink-0 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted">
                      Coming soon
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
