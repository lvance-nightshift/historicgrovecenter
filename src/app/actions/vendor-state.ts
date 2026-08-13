/*
 * Vendor-registration form state + initial value (shared by the craft/artisan
 * and food-vendor forms).
 *
 * Kept OUT of vendor-registration.ts because that file is `"use server"`,
 * which may only export async functions.
 */

export type VendorField =
  | "businessName"
  | "contactName"
  | "email"
  | "phone"
  | "products"
  | "agree"
  | "permit"
  | "insurance";

export type VendorState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<VendorField, string>>;
};

export const initialVendorState: VendorState = { ok: false, message: "" };
