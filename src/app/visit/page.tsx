import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Visit & Contact",
  description:
    "Directions, parking, hours, and how to reach the Grove Center Merchants Association in Oak Ridge, Tennessee.",
};

export default function VisitPage() {
  return (
    <>
      <PageHero
        eyebrow="Plan Your Visit"
        title="Come see us at the Grove"
        subtitle="Easy to reach, easy to park, and worth the trip. Here's everything you need to know."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Details */}
          <div className="space-y-10">
            <div>
              <div className="rule-brass" />
              <h2 className="mt-4 font-serif text-2xl font-semibold text-grove">
                Getting here
              </h2>
              <address className="mt-3 space-y-1 text-lg not-italic text-foreground/90">
                <p>{site.address.line1}</p>
                <p>{site.address.line2}</p>
              </address>
              <p className="mt-3 text-muted">
                Grove Center sits on Oak Ridge&apos;s east side, with free
                surface parking throughout the center.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-semibold text-grove">
                Hours
              </h2>
              <p className="mt-3 text-muted">
                Hours vary by merchant — see each shop on the{" "}
                <a href="/merchants" className="font-medium text-grove hover:underline">
                  Merchants
                </a>{" "}
                page. The courtyard and walkways are open daily; event hours are
                listed on the{" "}
                <a href="/events" className="font-medium text-grove hover:underline">
                  Events
                </a>{" "}
                page.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-semibold text-grove">
                Contact the Association
              </h2>
              <dl className="mt-3 space-y-2 text-lg">
                <div className="flex gap-3">
                  <dt className="w-16 text-muted">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${site.phone.replace(/[^0-9]/g, "")}`}
                      className="font-medium text-grove hover:underline"
                    >
                      {site.phone}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-16 text-muted">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${site.email}`}
                      className="font-medium text-grove hover:underline"
                    >
                      {site.email}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-16 text-muted">Social</dt>
                  <dd className="flex gap-4">
                    <a
                      href={site.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-grove hover:underline"
                    >
                      Facebook
                    </a>
                    <a
                      href={site.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-grove hover:underline"
                    >
                      Instagram
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Contact form + map placeholder */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <h2 className="font-serif text-2xl font-semibold text-grove">
                Send us a message
              </h2>
              <p className="mt-1 text-sm text-muted">
                Questions, event ideas, or membership interest — we&apos;ll get
                back to you.
              </p>
              <ContactForm />
            </div>

            {/* Map placeholder — replace with an embedded map */}
            <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-border bg-grove/5 text-center">
              <div className="px-6">
                <p className="font-serif text-xl italic text-grove/60">Map</p>
                <p className="mt-1 text-sm text-muted">
                  Embed a Google Map of Grove Center here
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
