import Link from "next/link";
import type { Merchant } from "@/lib/merchants";

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
      {merchant.category && (
        <span className="w-fit rounded-full bg-grove/10 px-2.5 py-0.5 text-xs font-medium text-grove">
          {merchant.category}
        </span>
      )}
      <h3 className="mt-3 font-serif text-xl font-semibold text-foreground group-hover:text-grove">
        {merchant.name}
      </h3>
      {merchant.tagline && (
        <p className="mt-1 text-sm font-medium text-brick-dark">
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
