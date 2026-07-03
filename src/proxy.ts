/*
 * Next.js 16 `proxy` (formerly `middleware`) — protects authenticated routes.
 *
 * Only runs for the paths in `config.matcher`. Until Neon Auth is configured,
 * it passes requests through untouched. Add protected paths to the matcher as
 * the app grows (e.g. an admin area for managing merchants/events).
 */
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

const protect = auth?.middleware({ loginUrl: "/auth/sign-in" });

export default function proxy(request: NextRequest) {
  if (protect) return protect(request);
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
