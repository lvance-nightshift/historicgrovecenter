/*
 * Server-side gate for the entire /admin area. Requires an admin actor
 * (developer or association_admin). Not-signed-in → sign-in; signed-in but
 * lacking the role → an in-place "not authorized" screen.
 */
import { redirect } from "next/navigation";
import { getActor, isAdmin } from "@/lib/auth/authorize";
import NotAuthorized from "@/components/NotAuthorized";

// Auth depends on the request's session cookie — never prerender /admin.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getActor();
  if (!actor) redirect("/auth/sign-in?returnTo=/admin/media");
  if (!isAdmin(actor)) return <NotAuthorized email={actor.user.email ?? undefined} />;
  return <>{children}</>;
}
