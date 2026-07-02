import type { Merchant } from "@/lib/merchants";

export default function MerchantCard({ merchant }: { merchant: Merchant }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className="w-fit rounded-full bg-grove/10 px-2.5 py-0.5 text-xs font-medium text-grove">
        {merchant.category}
      </span>
      <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">
        {merchant.name}
      </h3>
      <p className="mt-1 text-sm font-medium text-brick-dark">
        {merchant.tagline}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {merchant.description}
      </p>

      <dl className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
        {merchant.hours && (
          <div className="flex gap-2">
            <dt className="text-muted">Hours</dt>
            <dd className="font-medium text-foreground">{merchant.hours}</dd>
          </div>
        )}
        {merchant.phone && (
          <div className="flex gap-2">
            <dt className="text-muted">Phone</dt>
            <dd>
              <a
                href={`tel:${merchant.phone.replace(/[^0-9]/g, "")}`}
                className="font-medium text-grove hover:underline"
              >
                {merchant.phone}
              </a>
            </dd>
          </div>
        )}
        {merchant.website && (
          <div className="flex gap-2">
            <dt className="text-muted">Web</dt>
            <dd>
              <a
                href={merchant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-grove hover:underline"
              >
                Visit site ↗
              </a>
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
