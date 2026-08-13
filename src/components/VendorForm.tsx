"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitVendorRegistration } from "@/app/actions/vendor-registration";
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

export default function VendorForm({ variant }: { variant: "craft" | "food" }) {
  const isFood = variant === "food";
  const [state, formAction] = useActionState(
    submitVendorRegistration,
    initialVendorState,
  );

  if (state.ok) {
    return (
      <div className="rounded-xl border border-grove/30 bg-grove/10 p-6 text-center">
        <p className="font-serif text-xl font-semibold text-grove-dark">
          You&apos;re on the list! 🎃
        </p>
        <p className="mt-2 text-sm text-foreground/80">{state.message}</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" action={formAction}>
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
          {isFood ? "What will you be serving?" : "What will you be selling?"}
        </span>
        <textarea
          name="products"
          rows={3}
          required
          placeholder={
            isFood
              ? "e.g. wood-fired pizza, kettle corn, tacos, lemonade…"
              : "e.g. handmade candles, fall wreaths, jewelry…"
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
              {n} space{n > 1 ? "s" : ""} — ${n * 45}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-muted">
          $45 per space. Spaces are limited (30 total).
        </span>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-foreground">
          Special requests <span className="text-muted">(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={2}
          placeholder="Power access, corner spot, arriving early, etc."
          className={inputClass}
        />
      </label>

      {isFood && (
        <div className="space-y-4 rounded-lg border border-brass/40 bg-brass/5 p-4">
          <p className="text-sm font-medium text-foreground">
            Oak Ridge requires food vendors to be permitted &amp; insured — upload
            both here (PDF, JPG, or PNG).
          </p>
          <div>
            <DocUpload name="permitDocKey" label="Oak Ridge food-service permit" />
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
          I understand the $45 booth fee per space, that spaces are first come,
          first served, and that submitting this form reserves a space pending
          confirmation from the Grove Center.
        </span>
      </label>
      <Err msg={state.fieldErrors?.agree} />

      {state.message && !state.ok && (
        <p role="status" className="rounded-lg bg-brick/10 px-4 py-3 text-sm text-brick-dark">
          {state.message}
        </p>
      )}

      <SubmitButton label={isFood ? "Register as a food vendor" : "Reserve my vendor space"} />
    </form>
  );
}
