"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/*
 * Footer sign-in entry. Login here is a back-office door (merchants managing
 * their listing, admins managing the site) — not general public nav — so it
 * lives quietly at the bottom of the page and is labeled as such. Hidden once
 * signed in (the header then shows My Business / Admin / Sign out).
 */
export default function FooterSignIn() {
  // Default to showing the link (the vast majority of visitors are signed
  // out); hide it only once we confirm an active session.
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) setSignedIn(Boolean(d.signedIn));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (signedIn) return null;

  return (
    <Link
      href="/auth/sign-in"
      className="inline-flex items-center gap-1.5 text-background/60 transition-colors hover:text-background"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
      </svg>
      Merchant &amp; admin sign in
    </Link>
  );
}
