"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Better Auth appends the reset token to the redirect URL as `token`
  // (some flows use `?error=...` for an invalid/expired link).
  const token = params.get("token");
  const linkError = params.get("error");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.resetPassword({ newPassword: password, token });
      if (res.error) throw new Error(res.error.message || "Could not reset password");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const wrap = "mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16";

  if (!token || linkError) {
    return (
      <div className={wrap}>
        <h1 className="font-serif text-3xl font-semibold text-grove">Reset link expired</h1>
        <p className="mt-3 text-sm text-foreground/80">
          This password-reset link is invalid or has expired. Request a new one from the sign-in
          page.
        </p>
        <a href="/auth/sign-in" className="mt-6 text-sm text-grove hover:underline">
          ← Back to sign in
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className={wrap}>
        <h1 className="font-serif text-3xl font-semibold text-grove">Password updated ✓</h1>
        <p className="mt-3 text-sm text-foreground/80">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <button
          type="button"
          onClick={() => router.push("/auth/sign-in")}
          className="mt-6 w-full rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <h1 className="font-serif text-3xl font-semibold text-grove">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-foreground">New password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">Confirm new password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </label>

        {error && (
          <p className="rounded-md bg-brick/10 px-3 py-2 text-sm text-brick-dark">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark disabled:opacity-60"
        >
          {busy ? "…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
