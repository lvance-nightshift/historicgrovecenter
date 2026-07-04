"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/site", label: "Site" },
];

export default function AdminNav({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/admin" className="font-serif text-lg font-semibold text-grove">
          Grove Admin
        </Link>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? "bg-grove text-background"
                  : "text-foreground/70 hover:bg-grove/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {email && <span className="hidden text-muted sm:inline">{email}</span>}
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              router.replace("/auth/sign-in");
            }}
            className="rounded-full border border-border px-3 py-1.5 font-medium text-foreground hover:border-grove/50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
