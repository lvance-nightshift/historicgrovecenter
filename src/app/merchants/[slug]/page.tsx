import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import { getMerchantBySlug } from "@/lib/merchants-db";
import { DAYS, formatDay, hasWeekHours } from "@/lib/hours";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMerchantBySlug(slug);
  if (!m) return { title: "Merchant not found" };
  return {
    title: m.name,
    description: m.tagline ?? `${m.name} at Historic Grove Center.`,
  };
}

function tel(phone: string) {
  return `tel:${phone.replace(/[^0-9]/g, "")}`;
}

export default async function MerchantPage({ params }: Params) {
  const { slug } = await params;
  const m = await getMerchantBySlug(slug);
  if (!m) notFound();

  const hasContact = m.phone || m.website || m.address;
  const hasSocial = m.facebook || m.instagram;

  return (
    <>
      <PageHero
        eyebrow={m.category ?? "Merchant"}
        title={m.name}
        subtitle={m.tagline}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Link href="/merchants" className="text-sm text-grove hover:underline">
          ← All merchants
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-[1fr_18rem]">
          {/* Main */}
          <div>
            {m.logoUrl && (
              <span className="relative mb-6 block h-24 w-24 overflow-hidden rounded-xl border border-border bg-white">
                <Image
                  src={m.logoUrl}
                  alt={`${m.name} logo`}
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              </span>
            )}
            {m.description ? (
              <div
                className="text-lg leading-relaxed text-foreground/85 [&_a]:text-grove [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: m.description }}
              />
            ) : (
              <p className="text-muted">More about {m.name} coming soon.</p>
            )}

            {m.gallery && m.gallery.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {m.gallery.map((url, i) => (
                  <span
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border"
                  >
                    <Image
                      src={url}
                      alt={`${m.name} photo ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
                      className="object-cover"
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {(hasWeekHours(m.hoursByDay ?? {}) || m.hours) && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Hours
                </h2>
                {hasWeekHours(m.hoursByDay ?? {}) && (
                  <dl className="mt-2 space-y-1 text-sm">
                    {DAYS.map(({ key, short }) => (
                      <div key={key} className="flex justify-between gap-4">
                        <dt className="text-muted">{short}</dt>
                        <dd className="font-medium text-foreground">
                          {formatDay(m.hoursByDay?.[key])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {m.hours && (
                  <p className="mt-2 whitespace-pre-line text-sm text-muted">
                    {m.hours}
                  </p>
                )}
              </div>
            )}

            {hasContact && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Contact
                </h2>
                <dl className="mt-2 space-y-2 text-sm">
                  {m.phone && (
                    <div>
                      <dt className="sr-only">Phone</dt>
                      <dd>
                        <a href={tel(m.phone)} className="font-medium text-grove hover:underline">
                          {m.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {m.website && (
                    <div>
                      <dt className="sr-only">Website</dt>
                      <dd>
                        <a
                          href={m.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-grove hover:underline"
                        >
                          Visit website ↗
                        </a>
                      </dd>
                    </div>
                  )}
                  {m.address && (
                    <div>
                      <dt className="sr-only">Address</dt>
                      <dd className="whitespace-pre-line text-foreground">{m.address}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {hasSocial && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Follow
                </h2>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {m.facebook && (
                    <a href={m.facebook} target="_blank" rel="noopener noreferrer" className="font-medium text-grove hover:underline">
                      Facebook ↗
                    </a>
                  )}
                  {m.instagram && (
                    <a href={m.instagram} target="_blank" rel="noopener noreferrer" className="font-medium text-grove hover:underline">
                      Instagram ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
