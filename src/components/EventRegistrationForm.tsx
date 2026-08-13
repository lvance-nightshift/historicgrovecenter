"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitEventRegistration } from "@/app/actions/event-registration";
import { initialVendorState } from "@/app/actions/vendor-state";
import DocUpload from "@/components/DocUpload";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="mt-1 block text-xs text-brick-dark">{msg}</span>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Submitting…" : label}
    </button>
  );
}

/**
 * Generic public registration form for any event with sign-ups open.
 * `variant` picks the vendor or food-truck flavor; food adds required permit /
 * insurance uploads. The `eventSlug` is submitted hidden and re-validated
 * server-side.
 */
function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default function EventRegistrationForm({
  eventSlug,
  variant = "vendor",
  boothFeeCents = null,
}: {
  eventSlug: string;
  variant?: "vendor" | "food";
  boothFeeCents?: number | null;
}) {
  const isFood = variant === "food";
  const hasFee = boothFeeCents != null && boothFeeCents > 0;
  const [state, formAction] = useActionState(
    submitEventRegistration,
    initialVendorState,
  );

  if (state.ok) {
    return (
      <div className="rounded-xl border border-grove/30 bg-grove/10 p-6 text-center">
        <p className="font-serif text-xl font-semibold text-grove-dark">
          You&apos;re on the list! 🎉
        </p>
        <p className="mt-2 text-sm text-foreground/80">{state.message}</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" action={formAction}>
      <input type="hidden" name="eventSlug" value={eventSlug} />
      <input type="hidden" name="vendorType" value={variant} />

      <label className="block text-sm">
        <span className="font-medium text-foreground">
          {isFood ? "Food business / truck name" : "Business / booth name"}
        </span>
        <input type="text" name="businessName" required className={inputClass} />
        <Err msg={state.fieldErrors?.businessName} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-foreground">Contact name</span>
          <input type="text" name="contactName" required className={inputClass} />
          <Err msg={state.fieldErrors?.contactName} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">Phone</span>
          <input type="tel" name="phone" required className={inputClass} />
          <Err msg={state.fieldErrors?.phone} />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-foreground">Email</span>
        <input type="email" name="email" required className={inputClass} />
        <Err msg={state.fieldErrors?.email} />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-foreground">
          {isFood ? "What will you be serving?" : "What will you be offering?"}
        </span>
        <textarea
          name="products"
          rows={3}
          required
          placeholder={
            isFood
              ? "e.g. wood-fired pizza, tacos, kettle corn, lemonade…"
              : "Tell us about your goods, services, or activity…"
          }
          className={inputClass}
        />
        <Err msg={state.fieldErrors?.products} />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-foreground">Spaces</span>
        <select name="spaces" defaultValue="1" className={inputClass}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} space{n > 1 ? "s" : ""}
              {hasFee ? ` — ${dollars(n * boothFeeCents!)}` : ""}
            </option>
          ))}
        </select>
        {hasFee && (
          <span className="mt-1 block text-xs text-muted">
            {dollars(boothFeeCents!)} per space.
          </span>
        )}
      </label>

      <label className="block text-sm">
        <span className="font-medium text-foreground">
          Anything we should know? <span className="text-muted">(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={2}
          placeholder="Power access, space needs, arriving early, etc."
          className={inputClass}
        />
      </label>

      {isFood && (
        <div className="space-y-4 rounded-lg border border-brass/40 bg-brass/5 p-4">
          <p className="text-sm font-medium text-foreground">
            Food vendors must be permitted &amp; insured — upload both here (PDF,
            JPG, or PNG).
          </p>
          <div>
            <DocUpload name="permitDocKey" label="Food-service permit" />
            <Err msg={state.fieldErrors?.permit} />
          </div>
          <div>
            <DocUpload name="insuranceDocKey" label="Certificate of liability insurance" />
            <Err msg={state.fieldErrors?.insurance} />
          </div>
        </div>
      )}

      {/* Honeypot */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="agree" className="mt-1" />
        <span className="text-foreground/80">
          {hasFee
            ? `I understand the ${dollars(boothFeeCents!)} fee per space, that spaces may be limited, and that submitting this form requests a space pending confirmation from the Grove Center.`
            : "I understand that submitting this form requests a space pending confirmation from the Grove Center, and that spaces may be limited."}
        </span>
      </label>
      <Err msg={state.fieldErrors?.agree} />

      {state.message && !state.ok && (
        <p role="status" className="rounded-lg bg-brick/10 px-4 py-3 text-sm text-brick-dark">
          {state.message}
        </p>
      )}

      <SubmitButton label={isFood ? "Register as a food vendor" : "Submit registration"} />
    </form>
  );
}
