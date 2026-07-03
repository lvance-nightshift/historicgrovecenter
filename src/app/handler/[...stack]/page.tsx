/*
 * Stack Auth catch-all handler (sign-in, sign-up, account, callbacks, etc.).
 * Dormant until Neon Auth keys are configured — 404s otherwise.
 */
import { notFound } from "next/navigation";
import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

export default function Handler(props: unknown) {
  if (!stackServerApp) notFound();
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}
