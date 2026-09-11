"use client";

import { useActionState } from "react";

import { signIn, signUp, type ActionResult } from "@/app/actions/profile";

const initialState: ActionResult = { ok: true };

export function AuthForm() {
  const [signInState, signInAction, signInPending] = useActionState(
    (_prev: ActionResult, formData: FormData) =>
      signIn(
        String(formData.get("email") ?? ""),
        String(formData.get("password") ?? ""),
      ),
    initialState,
  );

  const [signUpState, signUpAction, signUpPending] = useActionState(
    (_prev: ActionResult, formData: FormData) =>
      signUp(
        String(formData.get("email") ?? ""),
        String(formData.get("password") ?? ""),
        String(formData.get("full_name") ?? ""),
      ),
    initialState,
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form
        action={signInAction}
        className="rounded border border-rule p-4"
      >
        <h2 className="font-serif text-base font-bold">Have an account? Sign in</h2>
        <label className="mt-4 block">
          <span className="text-xs font-semibold">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded border border-rule px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-rule px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={signInPending}
          className="mt-4 w-full rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
        >
          {signInPending ? "Signing in…" : "Sign In"}
        </button>
        {signInState.ok === false && (
          <p className="mt-3 text-xs font-medium text-red-700">
            {signInState.error}
          </p>
        )}
      </form>

      <form
        action={signUpAction}
        className="rounded border border-rule p-4"
      >
        <h2 className="font-serif text-base font-bold">New here? Create an account</h2>
        <label className="mt-4 block">
          <span className="text-xs font-semibold">Full name</span>
          <input
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="mt-1 w-full rounded border border-rule px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded border border-rule px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded border border-rule px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={signUpPending}
          className="mt-4 w-full rounded bg-saffron px-4 py-2 text-sm font-bold text-navy hover:opacity-90 disabled:opacity-50"
        >
          {signUpPending ? "Creating account…" : "Create Account"}
        </button>
        {signUpState.ok === false && (
          <p className="mt-3 text-xs font-medium text-red-700">
            {signUpState.error}
          </p>
        )}
        {signUpState.ok === true && signUpPending === false && (
          <p className="mt-3 text-xs font-medium text-green-800">
            Account created! Check your email to confirm, then sign in.
          </p>
        )}
      </form>
    </div>
  );
}