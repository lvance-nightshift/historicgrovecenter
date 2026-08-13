"use client";

import { useState } from "react";
import VendorForm from "@/components/VendorForm";

export default function VendorRegistrationTabs() {
  const [tab, setTab] = useState<"craft" | "food">("craft");

  return (
    <div>
      <div className="flex gap-2 rounded-full border border-border bg-background p-1">
        {(["craft", "food"] as const).map((t) => (
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
            {t === "craft" ? "Artisan & Craft" : "Food Vendor"}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted">
        {tab === "craft"
          ? "For makers and artisans selling crafts, art, and goods."
          : "For food trucks and food vendors. An Oak Ridge food permit and insurance are required."}
      </p>

      <div className="mt-5">
        {/* Remount on tab change so each form has its own clean state. */}
        <VendorForm key={tab} variant={tab} />
      </div>
    </div>
  );
}
