/*
 * Neon Auth API route — proxies sign-up, sign-in, OAuth callbacks, session, etc.
 * Returns 404 until Neon Auth is configured (see src/lib/auth/server.ts).
 */
import { auth } from "@/lib/auth/server";

const notConfigured = () =>
  new Response("Auth is not configured.", { status: 404 });

const handlers = auth?.handler();

export const GET = handlers?.GET ?? notConfigured;
export const POST = handlers?.POST ?? notConfigured;
