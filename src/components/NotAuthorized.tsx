"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function NotAuthorized({ email }: { email?: string }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-grove">
        Not authorized
      </h1>
      <p className="mt-3 text-muted">
        Your account{email ? ` (${email})` : ""} doesn&apos;t have access to the
        admin area yet. If you should, ask an administrator to grant you a role.
      </p>
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          router.replace("/auth/sign-in");
        }}
        className="mt-6 rounded-full border border-border px-5 py-2 font-medium text-foreground hover:border-grove/50"
      >
        Sign out
      </button>
    </div>
  );
}
