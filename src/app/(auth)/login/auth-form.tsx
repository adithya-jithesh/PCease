"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { submitWithoutReset } from "@/lib/forms";
import { resendConfirmation, signIn, signInWithGoogle, signUp, type AuthState } from "../actions";

export function AuthForm({ next, google }: { next: string; google: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});

  const state = mode === "signin" ? signInState : signUpState;
  const pending = signingIn || signingUp;

  return (
    <div className="mt-8 space-y-6">
      {google && (
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button className="btn-outline w-full py-2.5">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
            </svg>
            Continue with Google
          </button>
        </form>
      )}

      {google && (
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
        </div>
      )}

      <div className="grid grid-cols-2 rounded-full bg-surface-2 p-1 text-sm" role="tablist">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full py-1.5 font-medium transition ${mode === m ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submitWithoutReset(mode === "signin" ? signInAction : signUpAction)} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <label className="block space-y-1">
            <span className="text-sm font-medium">Username</span>
            <input name="username" required autoComplete="username" className="input" />
          </label>
        )}
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="input"
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-xl bg-err-soft px-3 py-2 text-sm text-err">
            {state.error}
          </p>
        )}
        {state.message && (
          <p role="status" className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">
            {state.message}
          </p>
        )}
        {state.pendingEmail && <ResendConfirmation email={state.pendingEmail} />}

        <button disabled={pending} className="btn-primary w-full py-2.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

function ResendConfirmation({ email }: { email: string }) {
  const [result, setResult] = useState<AuthState>({});
  const [pending, startTransition] = useTransition();

  return (
    <div className="text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await resendConfirmation(email)))}
        className="inline-flex items-center gap-1.5 text-accent underline disabled:opacity-50"
      >
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        Resend confirmation email
      </button>
      {result.message && <p className="mt-1 text-ok">{result.message}</p>}
      {result.error && <p className="mt-1 text-err">{result.error}</p>}
    </div>
  );
}
