import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth/authorize";
import { getManagedCompanies } from "@/lib/account";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Business" };

export default async function AccountPage() {
  const actor = await getActor();
  if (!actor) redirect("/auth/sign-in?returnTo=/account");

  const companies = await getManagedCompanies(actor);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-grove">My Business</h1>
      <p className="mt-1 text-sm text-muted">
        Signed in as {actor.user.email ?? actor.user.name ?? "you"}. Keep your
        Grove Center listing up to date — changes go live right away.
      </p>

      {companies.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-medium text-foreground">
            No business is linked to your account yet.
          </p>
          <p className="mt-1 text-sm text-muted">
            Once a Grove Center admin connects your business, it&apos;ll appear
            here for you to manage. Questions? Email{" "}
            <a
              href="mailto:info@historicgrovecenter.com"
              className="text-grove hover:underline"
            >
              info@historicgrovecenter.com
            </a>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {companies.map((c) => (
            <li key={c.id}>
              <Link
                href={`/account/business/${c.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <span className="font-serif text-lg font-semibold text-foreground">
                    {c.name}
                  </span>
                  {c.tagline && (
                    <p className="mt-0.5 text-sm text-muted">{c.tagline}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.published
                        ? "bg-grove/10 text-grove"
                        : "bg-brass/20 text-brick-dark"
                    }`}
                  >
                    {c.published ? "Live" : "Pending review"}
                  </span>
                  <span className="font-medium text-grove">Edit →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
