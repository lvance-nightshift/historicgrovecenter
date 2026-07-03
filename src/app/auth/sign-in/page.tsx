"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") || "/admin/media";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === "signup"
          ? await authClient.signUp.email({ email, password, name })
          : await authClient.signIn.email({ email, password });
      if (res.error) throw new Error(res.error.message || "Authentication failed");
      router.push(returnTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-grove">
        {mode === "signup" ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Grove Center administration
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <label className="block text-sm">
            <span className="font-medium text-foreground">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </label>
        )}
        <label className="block text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={inputClass}
          />
        </label>

        {error && (
          <p className="rounded-md bg-brick/10 px-3 py-2 text-sm text-brick-dark">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark disabled:opacity-60"
        >
          {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
        className="mt-6 text-sm text-grove hover:underline"
      >
        {mode === "signin"
          ? "Need an account? Create one"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
