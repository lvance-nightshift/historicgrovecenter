/*
 * Fall Pumpkin Fest 2026 — event details in one place.
 *
 * Used by the public registration landing (/pumpkin-fest), the vendor
 * registration action, and the seed script that creates the matching `events`
 * row. Transcribed from the printed vendor-registration sheet (incl. the
 * handwritten hours: setup 7am, street closed 9am, event 10am–4pm).
 */

export const PUMPKIN_FEST = {
  slug: "fall-pumpkin-fest-2026",
  title: "Fall Pumpkin Fest",
  motto: "Music · Pumpkins · Paws · Purpose",
  familyTag: "Fun for the whole family!",
  dateLabel: "Saturday, October 17, 2026",
  hoursLabel: "10 a.m. – 4 p.m.",
  setupLabel: "Vendor setup 7 a.m.",
  streetClosedLabel: "Street closes 9 a.m.",
  location: "Historic Grove Center, Oak Ridge, TN",
  boothFeeLabel: "$45 per vendor space",
  boothFeeCents: 4500,
  spots: 30,
  spotsLabel: "30 artisan craft vendor spaces — limited!",
  organizer: "Friends of the Grove Theater / Grove Center Merchants",
  sponsors: "Oklo — presenting sponsor",
  // Public (attendee) registration — free tickets + kids' pumpkin activity.
  eventbriteUrl:
    "https://www.eventbrite.com/e/fall-pumpkin-fest-at-the-oak-ridge-grove-center-tickets-1996451407904",
  // Vendors may reserve 1 or 2 spaces. The Square account has no quantity
  // selector, so Friends of the Grove made a separate fixed-price checkout for
  // each count — the link already charges the correct total (no "pay twice").
  maxSpaces: 2,
  paymentLinkBySpaces: {
    1: "https://checkout.square.site/merchant/MLQHSGNVPVBN4/checkout/TYI4MW2SZV5FMLA7LUYVM3HW",
    2: "https://square.link/u/Gixs7pG9",
  } as Record<number, string>,
  benefiting:
    "SARG, Inc. (Shelter Animals Rescue Group) & the Historic Grove Theater",
  contact: {
    name: "Shad — Oak Ridge Florist",
    email: "HistoricGroveCenter@gmail.com",
    phone: "865-482-9251",
  },
  // 10 a.m.–4 p.m. Eastern (EDT, UTC-4) on Oct 17, 2026.
  startAtISO: "2026-10-17T14:00:00.000Z",
  endAtISO: "2026-10-17T20:00:00.000Z",
  intro:
    "Reserve your spot at the Oak Ridge Historic Grove Center Fall Pumpkin Fest! This beloved community event brings together music, pumpkins, local vendors, a petting zoo, and a pet costume contest for a day of fun for the whole family.",
  benefitBlurb:
    "This year's Pumpkin Fest benefits SARG, Inc. (Shelter Animals Rescue Group) & the Historic Grove Theater. Join us in making it the best one yet!",
  highlights: [
    "30 artisan craft vendor spaces available — first come, first served",
    "$45 per vendor space",
    "Food vendors welcome (Oak Ridge permit + insurance required)",
    "Live music, free pumpkins, petting zoo & pet costume contest",
    "Reserve your free pumpkin while supplies last",
    "High foot-traffic community event in the heart of the Grove Center",
  ],
  // Oak Ridge Floral's hands-on Succulent Pumpkin workshop, held during the
  // fest. Registration/payment is a per-session Square link (Friends of the
  // Grove account). A session with an empty `registerUrl` shows "coming soon".
  workshop: {
    slug: "succulent-pumpkin-workshop-2026", // matches the events table row
    title: "Succulent Pumpkin Design Workshop",
    presenter: "Brandon Salamacha — Oak Ridge Floral",
    blurb:
      "A hands-on seasonal design workshop: build your own fall centerpiece from heirloom pumpkins and live succulents — a long-lasting arrangement you'll enjoy through Thanksgiving.",
    priceLabel: "$50 per person",
    slotsLabel: "15 spots per session",
    sessions: [
      {
        label: "Session 1 · 11:00 a.m. – 12:15 p.m.",
        registerUrl: "https://square.link/u/6YLm2Zu4",
      },
      {
        label: "Session 2 · 1:00 p.m. – 2:15 p.m.",
        registerUrl: "https://square.link/u/VRJjkYY2",
      },
    ],
  },
} as const;

export type PumpkinFest = typeof PUMPKIN_FEST;
