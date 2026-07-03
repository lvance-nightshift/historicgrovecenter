/*
 * Next.js 16 `proxy` (formerly `middleware`).
 *
 * Two jobs:
 *  1. Coming-soon gate — when COMING_SOON is set, rewrite every page request
 *     to /coming-soon so the whole site shows the placeholder. Set this env
 *     var on the PRODUCTION environment only; leave it off for dev/preview and
 *     local so the full site keeps working there. Remove it to launch.
 *  2. Auth protection — protect /account and /admin once Neon Auth is on.
 *
 * The matcher runs on all page routes (static assets, _next, and /api are
 * excluded), so path-specific logic lives inside the function.
 */
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

const COMING_SOON =
  process.env.COMING_SOON === "true" || process.env.COMING_SOON === "1";

const protect = auth?.middleware({ loginUrl: "/auth/sign-in" });

// Areas that must stay reachable even while the public site shows "Coming
// Soon" — so admins/coordinators can sign in and work before launch.
const COMING_SOON_EXEMPT = ["/coming-soon", "/auth", "/admin", "/account"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Coming-soon takeover (production only, via env var).
  if (
    COMING_SOON &&
    !COMING_SOON_EXEMPT.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/coming-soon";
    return NextResponse.rewrite(url);
  }

  // 2) Auth protection, scoped to protected areas only.
  const isProtected =
    pathname.startsWith("/account") || pathname.startsWith("/admin");
  if (protect && isProtected) return protect(request);

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, static assets, and API routes.
  matcher: ["/((?!api/|_next/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
