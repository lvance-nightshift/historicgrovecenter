"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitEventRegistration } from "@/app/actions/event-registration";
import { initialVendorState } from "@/app/actions/vendor-state";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="mt-1 block text-xs text-brick-dark">{msg}</span>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Submit registration"}
    </button>
  );
}

/**
 * Generic public vendor-registration form for any event with sign-ups open.
 * The `eventSlug` is submitted as a hidden field and re-validated server-side.
 */
export default function EventRegistrationForm({ eventSlug }: { eventSlug: string }) {
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

      <label className="block text-sm">
        <span className="font-medium text-foreground">Business / booth name</span>
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
          What will you be offering?
        </span>
        <textarea
          name="products"
          rows={3}
          required
          placeholder="Tell us about your goods, services, or activity…"
          className={inputClass}
        />
        <Err msg={state.fieldErrors?.products} />
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
          I understand that submitting this form requests a vendor space pending
          confirmation from the Grove Center, and that spaces may be limited.
        </span>
      </label>
      <Err msg={state.fieldErrors?.agree} />

      {state.message && !state.ok && (
        <p role="status" className="rounded-lg bg-brick/10 px-4 py-3 text-sm text-brick-dark">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
