import type { Metadata } from "next";
import MerchantDirectory from "@/components/MerchantDirectory";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Merchants",
  description:
    "Meet the independent shops, eateries, and services of Historic Grove Center — members of the Grove Center Merchants Association.",
};

export default function MerchantsPage() {
  return (
    <>
      <PageHero
        eyebrow="Directory"
        title="Meet the Merchants"
        subtitle="Independent, locally owned, and here to serve the neighborhood — the businesses that make Grove Center what it is."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <MerchantDirectory />
      </section>

      {/* Join CTA */}
      <section className="bg-grove-dark text-background">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass-light">
            Own a business?
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Join the Merchants Association
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-background/80">
            Members share in marketing, courtyard events, and a voice in the
            future of a historic Oak Ridge landmark. We&apos;d love to have you
            at the Grove.
          </p>
          <a
            href="/visit"
            className="mt-7 inline-block rounded-full bg-brass px-6 py-3 font-semibold text-grove-dark transition-colors hover:bg-brass-light"
          >
            Inquire about membership
          </a>
        </div>
      </section>
    </>
  );
}
