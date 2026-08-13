import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActor, isAdmin } from "@/lib/auth/authorize";
import { getManagedCompanies } from "@/lib/account";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const actor = await getActor();
  if (!actor) redirect("/auth/sign-in?returnTo=/account");

  const companies = await getManagedCompanies(actor);
  const admin = isAdmin(actor);
  const firstName = actor.user.name?.trim().split(/\s+/)[0];

  // Each thing the person can reach is a card. New role types (event vendors,
  // bands, …) drop in here later without touching sign-in.
  const hasAnything = companies.length > 0 || admin;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-grove">
        Welcome back{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {hasAnything
          ? "Choose what you'd like to manage."
          : `Signed in as ${actor.user.email ?? "you"}.`}
      </p>

      {!hasAnything ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-medium text-foreground">
            Nothing is linked to your account yet.
          </p>
          <p className="mt-1 text-sm text-muted">
            Once a Grove Center admin connects your business or event role,
            it&apos;ll appear here. Questions? Email{" "}
            <a href="mailto:info@historicgrovecenter.com" className="text-grove hover:underline">
              info@historicgrovecenter.com
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Merchant business cards */}
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/account/business/${c.id}`}
              className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-brass-dark">
                My Business
              </span>
              <span className="mt-1 font-serif text-lg font-semibold text-foreground">
                {c.name}
              </span>
              {c.tagline && (
                <span className="mt-0.5 text-sm text-muted">{c.tagline}</span>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    c.published
                      ? "bg-grove/10 text-grove"
                      : "bg-brass/20 text-brick-dark"
                  }`}
                >
                  {c.published ? "Live" : "Pending review"}
                </span>
                <span className="text-sm font-medium text-grove">Edit listing →</span>
              </div>
            </Link>
          ))}

          {/* Admin console card */}
          {admin && (
            <Link
              href="/admin"
              className="flex flex-col rounded-xl border border-brass/40 bg-brass/5 p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-brass-dark">
                Staff
              </span>
              <span className="mt-1 font-serif text-lg font-semibold text-foreground">
                Admin Console
              </span>
              <span className="mt-0.5 text-sm text-muted">
                Site content, people, media, events &amp; themes
              </span>
              <span className="mt-4 text-sm font-medium text-grove">Open →</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
