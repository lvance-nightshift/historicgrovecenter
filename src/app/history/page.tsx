import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "History",
  description:
    "The story of Grove Center — one of Oak Ridge's original shopping centers, built to serve the Manhattan Project's Secret City.",
};

const timeline = [
  {
    year: "1942",
    title: "The Secret City begins",
    body: "The U.S. Army selects the rural ridges of East Tennessee for a classified Manhattan Project site. A planned city — Oak Ridge — is laid out from scratch to house tens of thousands of workers.",
  },
  {
    year: "1949",
    title: "Grove Center opens",
    body: "As Oak Ridge's east side fills in, Grove Center rises as one of the city's original neighborhood shopping centers, complete with the Grove Theater and a main street of shops.",
  },
  {
    year: "1950s–60s",
    title: "A neighborhood hub",
    body: "The soda fountain, barbershop, and theater make Grove Center a daily gathering place as Oak Ridge transitions from a secret war town to an open, permanent city.",
  },
  {
    year: "Today",
    title: "A living landmark",
    body: "The Grove Center Merchants Association carries the tradition forward — independent shops, community events, and a marquee that still lights the courtyard.",
  },
];

export default function HistoryPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Story"
        title="Built by the Secret City"
        subtitle="Grove Center is a piece of Oak Ridge history you can still walk through — a wartime shopping center that became a lasting neighborhood heart."
      />

      {/* Placeholder-content notice — remove once real history is confirmed */}
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <p className="rounded-lg border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-foreground/80">
          <strong>Note:</strong> This history is a draft written from general
          Oak Ridge background. Please verify dates and details, and add
          firsthand accounts and photos from the Association&apos;s archives.
        </p>
      </div>

      {/* Narrative */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="prose-grove space-y-6 text-lg leading-relaxed text-foreground/90">
          <p>
            In 1942, the United States government quietly acquired some 60,000
            acres of East Tennessee farmland and forest for the most secret
            undertaking of the Second World War. Within months, a city that
            appeared on no map — Oak Ridge — was rising from the mud to enrich
            the uranium that would fuel the Manhattan Project.
          </p>
          <p>
            To house and provision the tens of thousands of workers who poured
            in, planners designed Oak Ridge as a series of self-contained
            neighborhoods. Rather than a single downtown, the city was given
            several shopping centers, each serving the homes around it. Grove
            Center was built to anchor the east side of town.
          </p>
          <p>
            At its center stood the Grove Theater, whose marquee became a
            landmark for a generation of residents. Around it clustered the
            everyday institutions of American life the Secret City had done
            without: a soda fountain, a barbershop, a grocery, shops, and a
            courtyard where neighbors met. For workers whose jobs they could not
            discuss, Grove Center was a rare place to simply be a community.
          </p>
          <p>
            When the war ended and Oak Ridge&apos;s gates finally opened to the
            public in 1949, Grove Center passed from a government-run convenience
            into a genuine neighborhood main street. Through the decades that
            followed it weathered the changes that reshaped so many American
            shopping districts — and endured, thanks to the independent
            merchants who made it their own.
          </p>
          <p>
            Today the Grove Center Merchants Association stewards that legacy:
            keeping the shops local, the events lively, and the marquee lit for
            the next generation of Oak Ridgers.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-surface/60">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="rule-brass mx-auto" />
          <h2 className="mt-4 text-center font-serif text-3xl font-semibold text-grove">
            A brief timeline
          </h2>
          <ol className="mt-12 space-y-10">
            {timeline.map((item) => (
              <li key={item.year} className="flex gap-6">
                <div className="flex w-24 shrink-0 flex-col items-end">
                  <span className="font-serif text-2xl font-semibold text-brick">
                    {item.year}
                  </span>
                </div>
                <div className="relative border-l-2 border-border pb-2 pl-6">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-brass" />
                  <h3 className="font-serif text-xl font-semibold text-grove">
                    {item.title}
                  </h3>
                  <p className="mt-1 leading-relaxed text-muted">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-serif text-2xl font-semibold text-grove">
          Have a story or photo to share?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-muted">
          The Association is always collecting memories and images of Grove
          Center. We&apos;d love to hear yours.
        </p>
        <Link
          href="/visit"
          className="mt-6 inline-block rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark"
        >
          Get in touch
        </Link>
      </section>
    </>
  );
}
