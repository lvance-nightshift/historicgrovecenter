"use client";

/*
 * Neon Auth (Better Auth) — browser client.
 * Talks to the app's own /api/auth/* route (same origin), so no env is needed
 * here. Use for sign-in / sign-up / sign-out forms and client session reads.
 */

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();
