/*
 * Contact-form state shape + initial value.
 *
 * Kept OUT of contact.ts because that file is `"use server"`, which may only
 * export async functions — exporting this object from there is a build error
 * and breaks the client's useActionState.
 */

export type ContactState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
};

export const initialContactState: ContactState = { ok: false, message: "" };
