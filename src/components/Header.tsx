"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";
import { authClient } from "@/lib/auth/client";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);

  // Show Sign in / Admin / My Business links based on the viewer's session.
  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setSignedIn(Boolean(d.signedIn));
        setIsAdmin(Boolean(d.isAdmin));
        setIsMerchant(Boolean(d.isMerchant));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    await authClient.signOut().catch(() => {});
    setSignedIn(false);
    setIsAdmin(false);
    setIsMerchant(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Wordmark */}
        <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-border shadow-sm">
            <Image
              src="/grove-center-logo.jpg"
              alt="Historic Grove Center logo"
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-semibold tracking-tight text-grove">
              {site.name}
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">
              {site.city}
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-grove text-background"
                  : "text-foreground/80 hover:bg-grove/10 hover:text-grove"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isMerchant && (
            <Link
              href="/account"
              className="ml-1 rounded-full border border-grove/40 px-4 py-2 text-sm font-semibold text-grove transition-colors hover:bg-grove/10"
            >
              My Business
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="ml-1 rounded-full bg-brass px-4 py-2 text-sm font-semibold text-grove-dark transition-colors hover:bg-brass-light"
            >
              Admin
            </Link>
          )}
          {signedIn && (
            <button
              type="button"
              onClick={signOut}
              className="ml-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-grove"
            >
              Sign out
            </button>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-grove md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2.5 text-base font-medium ${
                isActive(item.href)
                  ? "bg-grove text-background"
                  : "text-foreground hover:bg-grove/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isMerchant && (
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-md border border-grove/40 px-3 py-2.5 text-base font-semibold text-grove"
            >
              My Business
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-md bg-brass px-3 py-2.5 text-base font-semibold text-grove-dark"
            >
              Admin
            </Link>
          )}
          {signedIn && (
            <button
              type="button"
              onClick={signOut}
              className="mt-1 block w-full rounded-md px-3 py-2.5 text-left text-base font-medium text-foreground hover:bg-grove/10"
            >
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
