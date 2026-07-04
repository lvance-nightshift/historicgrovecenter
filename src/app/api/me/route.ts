/*
 * GET /api/me — lightweight "who am I" for the client. Reports sign-in +
 * whether the viewer is an admin (from our role_assignments), so the public
 * header can show an Admin link only to admins. Never throws for anonymous.
 */
import { NextResponse } from "next/server";
import { getActor, isAdmin } from "@/lib/auth/authorize";

export const runtime = "nodejs";

export async function GET() {
  try {
    const actor = await getActor();
    return NextResponse.json({
      signedIn: Boolean(actor),
      isAdmin: actor ? isAdmin(actor) : false,
      name: actor?.user.name ?? null,
    });
  } catch {
    return NextResponse.json({ signedIn: false, isAdmin: false, name: null });
  }
}
