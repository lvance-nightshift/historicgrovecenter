/*
 * Merchant directory data.
 *
 * PLACEHOLDER CONTENT — replace with the real Grove Center merchants.
 * Each merchant renders a card on /merchants. Keep `slug` unique.
 */

export type Merchant = {
  slug: string;
  name: string;
  category: MerchantCategory;
  tagline: string;
  description: string;
  phone?: string;
  website?: string;
  hours?: string;
};

export type MerchantCategory =
  | "Dining"
  | "Shopping"
  | "Services"
  | "Health & Beauty"
  | "Arts & Culture";

export const CATEGORIES: MerchantCategory[] = [
  "Dining",
  "Shopping",
  "Services",
  "Health & Beauty",
  "Arts & Culture",
];

export const merchants: Merchant[] = [
  {
    slug: "grove-theater",
    name: "The Grove Theater",
    category: "Arts & Culture",
    tagline: "A restored 1949 movie house and live venue",
    description:
      "The heart of the center since it first lit its marquee, the Grove Theater now hosts films, concerts, and community events under its original neon sign.",
    phone: "(865) 555-0142",
    website: "https://example.com",
    hours: "Showtimes vary — see events",
  },
  {
    slug: "corner-soda-fountain",
    name: "Corner Soda Fountain",
    category: "Dining",
    tagline: "Malts, floats, and a lunch counter that never left",
    description:
      "Spin a stool at the original counter for hand-dipped milkshakes, grilled sandwiches, and pie by the slice.",
    phone: "(865) 555-0118",
    hours: "Mon–Sat 8am–6pm",
  },
  {
    slug: "grove-mercantile",
    name: "Grove Mercantile",
    category: "Shopping",
    tagline: "Gifts, goods, and Oak Ridge keepsakes",
    description:
      "A general store for the modern age — local crafts, home goods, and Secret City history you can take home.",
    phone: "(865) 555-0173",
    hours: "Tue–Sun 10am–6pm",
  },
  {
    slug: "atomic-city-coffee",
    name: "Atomic City Coffee",
    category: "Dining",
    tagline: "Small-batch roasts & morning pastries",
    description:
      "Neighborhood coffee bar pouring espresso, pour-overs, and house-baked scones since sunrise.",
    website: "https://example.com",
    hours: "Daily 6:30am–3pm",
  },
  {
    slug: "grove-barbershop",
    name: "Grove Barbershop",
    category: "Health & Beauty",
    tagline: "Classic cuts, hot-towel shaves",
    description:
      "Three chairs, straight razors, and conversation — the same trade that's served the center for generations.",
    phone: "(865) 555-0166",
    hours: "Tue–Sat 9am–5pm",
  },
  {
    slug: "secret-city-books",
    name: "Secret City Books",
    category: "Shopping",
    tagline: "New, used & local-interest titles",
    description:
      "An independent bookshop with a deep Oak Ridge & Manhattan Project section and a reading nook in the back.",
    hours: "Wed–Sun 11am–7pm",
  },
  {
    slug: "grove-cleaners",
    name: "Grove Cleaners",
    category: "Services",
    tagline: "Dry cleaning & alterations",
    description:
      "Fast, careful garment care and tailoring, a fixture at the center for decades.",
    phone: "(865) 555-0109",
    hours: "Mon–Fri 7am–6pm, Sat 8am–2pm",
  },
  {
    slug: "willow-floral",
    name: "Willow & Grove Floral",
    category: "Shopping",
    tagline: "Fresh arrangements & garden plants",
    description:
      "Seasonal bouquets, wedding florals, and porch plants from a family-run studio.",
    phone: "(865) 555-0155",
    hours: "Mon–Sat 9am–5pm",
  },
];
