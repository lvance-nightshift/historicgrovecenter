"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContact } from "@/app/actions/contact";
import { initialContactState } from "@/app/actions/contact-state";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(
    submitContact,
    initialContactState,
  );

  return (
    <form className="mt-6 space-y-4" action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-foreground">Name</span>
          <input type="text" name="name" required className={inputClass} />
          {state.fieldErrors?.name && (
            <span className="mt-1 block text-xs text-brick-dark">
              {state.fieldErrors.name}
            </span>
          )}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input type="email" name="email" required className={inputClass} />
          {state.fieldErrors?.email && (
            <span className="mt-1 block text-xs text-brick-dark">
              {state.fieldErrors.email}
            </span>
          )}
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-foreground">Subject</span>
        <input type="text" name="subject" className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-foreground">Message</span>
        <textarea name="message" rows={5} required className={inputClass} />
        {state.fieldErrors?.message && (
          <span className="mt-1 block text-xs text-brick-dark">
            {state.fieldErrors.message}
          </span>
        )}
      </label>

      {state.message && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${
            state.ok
              ? "bg-grove/10 text-grove-dark"
              : "bg-brick/10 text-brick-dark"
          }`}
        >
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
