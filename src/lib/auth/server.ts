/*
 * Neon Auth (Better Auth) — server instance.
 *
 * Neon Auth is powered by Better Auth; Neon hosts the auth backend and
 * provisions the Better Auth tables in the `neon_auth` schema of this database.
 * The app talks to that hosted backend via NEON_AUTH_BASE_URL.
 *
 * GUARDED: `auth` is null until both env vars are set, so the production build
 * (which has no secrets) stays green. Callers must null-check.
 *
 * Env (Neon console → Auth → Configuration):
 *   NEON_AUTH_BASE_URL       your Neon Auth instance URL
 *   NEON_AUTH_COOKIE_SECRET  session-cookie signing secret (>= 32 chars;
 *                            generate with `openssl rand -base64 32`)
 */

import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

export const isAuthConfigured = Boolean(
  baseUrl && cookieSecret && cookieSecret.length >= 32,
);

export const auth = isAuthConfigured
  ? createNeonAuth({
      baseUrl: baseUrl!,
      cookies: { secret: cookieSecret! },
    })
  : null;
