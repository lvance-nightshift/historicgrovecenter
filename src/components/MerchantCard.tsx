import Link from "next/link";
import Image from "next/image";
import type { Merchant } from "@/lib/merchants";

/** Initials for the logo fallback — up to two, skipping small joining words. */
function initials(name: string): string {
  const skip = new Set(["the", "a", "an", "of", "and", "&"]);
  const words = name
    .split(/\s+/)
    .filter((w) => w && !skip.has(w.toLowerCase().replace(/[^a-z&]/gi, "")));
  const letters = (words.length ? words : name.split(/\s+/))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (letters || name[0] || "?").toUpperCase();
}

export default function MerchantCard({ merchant }: { merchant: Merchant }) {
  // Description may be rich-text HTML — strip to a plain-text teaser.
  const excerpt = merchant.description
    ? merchant.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";
  return (
    <Link
      href={`/merchants/${merchant.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-grove/40 hover:shadow-md"
    >
      {merchant.categories && merchant.categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {merchant.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-grove/10 px-2.5 py-0.5 text-xs font-medium text-grove"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        {merchant.logoUrl ? (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
            <Image
              src={merchant.logoUrl}
              alt=""
              fill
              sizes="48px"
              className="object-contain p-1"
            />
          </span>
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-grove/10 font-serif text-lg font-semibold text-grove">
            {initials(merchant.name)}
          </span>
        )}
        <h3 className="min-w-0 font-serif text-xl font-semibold text-foreground group-hover:text-grove">
          {merchant.name}
        </h3>
      </div>

      {merchant.tagline && (
        <p className="mt-2 text-sm font-medium text-brick-dark">
          {merchant.tagline}
        </p>
      )}
      {excerpt && (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted line-clamp-3">
          {excerpt}
        </p>
      )}

      <div className="mt-5 border-t border-border pt-4 text-sm">
        {merchant.hours && (
          <div className="flex gap-2">
            <span className="text-muted">Hours</span>
            <span className="font-medium text-foreground">{merchant.hours}</span>
          </div>
        )}
        <span className="mt-2 inline-block font-medium text-grove">
          View page →
        </span>
      </div>
    </Link>
  );
}
