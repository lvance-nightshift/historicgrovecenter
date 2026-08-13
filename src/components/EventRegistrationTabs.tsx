"use client";

import { useState } from "react";
import EventRegistrationForm from "@/components/EventRegistrationForm";

/**
 * Chooses the vendor vs food-truck registration form for an event, based on
 * which intake toggles are on. When only one is open there are no tabs — just
 * that form.
 */
export default function EventRegistrationTabs({
  eventSlug,
  vendorOpen,
  foodOpen,
  boothFeeCents = null,
}: {
  eventSlug: string;
  vendorOpen: boolean;
  foodOpen: boolean;
  boothFeeCents?: number | null;
}) {
  const [tab, setTab] = useState<"vendor" | "food">(vendorOpen ? "vendor" : "food");

  if (!vendorOpen || !foodOpen) {
    return (
      <EventRegistrationForm
        eventSlug={eventSlug}
        variant={foodOpen ? "food" : "vendor"}
        boothFeeCents={boothFeeCents}
      />
    );
  }

  return (
    <div>
      <div className="flex gap-2 rounded-full border border-border bg-background p-1">
        {(["vendor", "food"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-grove text-background"
                : "text-foreground/70 hover:text-grove"
            }`}
          >
            {t === "vendor" ? "Vendor" : "Food Truck"}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted">
        {tab === "vendor"
          ? "For makers, artisans, and vendors selling goods or services."
          : "For food trucks and food vendors. A food permit and insurance are required."}
      </p>

      <div className="mt-5">
        {/* Remount on tab change so each form has its own clean state. */}
        <EventRegistrationForm
          key={tab}
          eventSlug={eventSlug}
          variant={tab}
          boothFeeCents={boothFeeCents}
        />
      </div>
    </div>
  );
}
