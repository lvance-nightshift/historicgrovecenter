/*
 * Vendor-registration form state + initial value.
 *
 * Kept OUT of vendor-registration.ts because that file is `"use server"`,
 * which may only export async functions — exporting this object from there is a
 * build error and breaks the client's useActionState.
 */

export type VendorField =
  | "businessName"
  | "contactName"
  | "email"
  | "phone"
  | "products"
  | "agree";

export type VendorState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<VendorField, string>>;
};

export const initialVendorState: VendorState = { ok: false, message: "" };
