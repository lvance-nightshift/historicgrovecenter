/*
 * Neon Auth = Stack Auth. This wires the Stack server app used across the site.
 *
 * GUARDED: Stack reads its keys from env at construction. Those keys are not
 * present during the production build, so we construct the app lazily and only
 * when all three env vars exist. `stackServerApp` is null until configured,
 * and the auth UI/handler stay dormant — keeping the build green.
 *
 * Neon Auth provides these values (Neon console → Auth → Configuration):
 *   NEXT_PUBLIC_STACK_PROJECT_ID
 *   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
 *   STACK_SECRET_SERVER_KEY
 */

import "server-only";
import { StackServerApp } from "@stackframe/stack";

export const isAuthConfigured =
  Boolean(process.env.NEXT_PUBLIC_STACK_PROJECT_ID) &&
  Boolean(process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY) &&
  Boolean(process.env.STACK_SECRET_SERVER_KEY);

export const stackServerApp = isAuthConfigured
  ? new StackServerApp({
      tokenStore: "nextjs-cookie",
      urls: { handler: "/handler" },
    })
  : null;
