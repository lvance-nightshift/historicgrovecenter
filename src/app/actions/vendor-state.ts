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
  // On success, when the event has a booth fee + a hosted checkout link: the
  // "Pay booth fee" button to show. `perSpace` notes single-space fee handling
  // for multi-space registrations (the Square link charges one space per run).
  payment?: {
    url: string;
    amountLabel: string;
    spaces: number;
    perSpaceLabel: string;
    // true when the link already charges the exact total for the chosen space
    // count (no "run the checkout once per space" note needed).
    exactAmount?: boolean;
  };
};

export const initialVendorState: VendorState = { ok: false, message: "" };
