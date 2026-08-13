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
  spotsLabel: "30 artisan & craft vendor spaces — limited!",
  organizer: "Friends of the Grove Theater / Grove Center Merchants",
  sponsors: "Oklo — presenting sponsor",
  benefiting:
    "SARG Inc. (Shelter Animals Rescue Group), the Historic Grove Theater & the local arts",
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
    "The Pumpkin Fest benefits SARG Inc. (Shelter Animals Rescue Group), the Historic Grove Theater, and local arts. Join us in making it the best one yet!",
  highlights: [
    "30 artisan & craft vendor spaces — first come, first served",
    "$45 per vendor space",
    "Food vendors welcome (Oak Ridge permit + insurance required)",
    "Live music, pumpkins, petting zoo & pet costume contest",
    "High-foot-traffic community event in the heart of the Grove Center",
  ],
} as const;

export type PumpkinFest = typeof PUMPKIN_FEST;
