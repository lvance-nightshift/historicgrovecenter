import Link from "next/link";
import { nav, site } from "@/lib/site";
import type { SiteContact } from "@/lib/site-settings";
import FooterSignIn from "@/components/FooterSignIn";

export default function Footer({ contact }: { contact: SiteContact }) {
  const year = 2026; // Static build; bump as needed or wire to a build-time value.

  return (
    <footer className="mt-auto border-t border-border bg-grove-dark text-background/90">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-xl font-semibold text-background">
            {site.fullName}
          </p>
          <p className="mt-3 max-w-xs text-sm text-background/70">
            {site.tagline}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-brass-light">
            {site.association}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-brass-light">
            Explore
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-background/80 transition-colors hover:text-background"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-brass-light">
            Visit &amp; Contact
          </h3>
          <address className="mt-4 space-y-2 text-sm not-italic text-background/80">
            <p>{contact.addressLine1}</p>
            <p>{contact.addressLine2}</p>
            <p>
              <a href={`tel:${contact.phone.replace(/[^0-9]/g, "")}`} className="hover:text-background">
                {contact.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${contact.email}`} className="break-all hover:text-background">
                {contact.email}
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-background/60 sm:flex-row sm:px-6">
          <p>
            &copy; {year} {site.association}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <FooterSignIn />
            <p>{site.city}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
