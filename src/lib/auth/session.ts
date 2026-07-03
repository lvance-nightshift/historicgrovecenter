/*
 * Session helpers over Neon Auth (Better Auth). Returns the logged-in user, or
 * null when auth isn't configured / nobody is signed in. Safe to call anywhere
 * server-side.
 *
 * NOTE: role-based authorization (developer / admin / merchant / coordinator)
 * will layer on top of this once we wire people ↔ role_assignments. For now
 * these gate on "is a signed-in user."
 */

import "server-only";
import { auth } from "./server";

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!auth) return null;
  try {
    const { data } = await auth.getSession();
    const user = data?.user;
    return user ? { id: user.id, email: user.email, name: user.name } : null;
  } catch {
    return null;
  }
}
