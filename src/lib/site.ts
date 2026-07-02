/*
 * Site-wide constants. Update contact details, social links, and
 * navigation here in one place.
 */

export const site = {
  name: "Grove Center",
  fullName: "Historic Grove Center",
  association: "Grove Center Merchants Association",
  tagline: "Oak Ridge's original neighborhood shopping center — since 1949.",
  city: "Oak Ridge, Tennessee",
  // PLACEHOLDER — replace with the real address, email, and phone.
  address: {
    line1: "Grove Center",
    line2: "Oak Ridge, TN 37830",
  },
  email: "info@historicgrovecenter.com",
  phone: "(865) 555-0100",
  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
  },
} as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/events", label: "Events" },
  { href: "/merchants", label: "Merchants" },
  { href: "/visit", label: "Visit" },
] as const;
