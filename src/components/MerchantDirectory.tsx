"use client";

import { useMemo, useState } from "react";
import MerchantCard from "@/components/MerchantCard";
import { CATEGORIES, type Merchant, type MerchantCategory } from "@/lib/merchants";

type Filter = MerchantCategory | "All";

export default function MerchantDirectory({
  merchants,
}: {
  merchants: Merchant[];
}) {
  const [filter, setFilter] = useState<Filter>("All");

  const filters: Filter[] = ["All", ...CATEGORIES];

  const visible = useMemo(
    () =>
      filter === "All"
        ? merchants
        : merchants.filter((m) => m.category === filter),
    [filter, merchants],
  );

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-grove text-background"
                  : "border border-border bg-surface text-foreground/80 hover:border-grove/40 hover:text-grove"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((merchant) => (
          <MerchantCard key={merchant.slug} merchant={merchant} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-8 text-muted">
          {merchants.length === 0
            ? "Our merchant directory is coming soon."
            : "No merchants in this category yet."}
        </p>
      )}
    </div>
  );
}
