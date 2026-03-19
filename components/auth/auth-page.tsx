"use client";

import { GoogleSignInButton } from "./google-sign-in-button";

export function AuthPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 rounded-lg border border-border bg-card p-8 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--journal)] to-[var(--notes)] text-2xl text-white">
            J
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Journal
          </h1>
          <p className="text-sm text-muted-foreground">
            A private place for your thoughts, meals, and notes — encrypted by
            default.
          </p>
        </div>

        <div className="border-t border-border" />

        <GoogleSignInButton />

        <div className="border-t border-border" />

        <p className="text-xs text-muted-foreground">
          Your data is encrypted end-to-end. Only you can read it.
        </p>
      </div>
    </div>
  );
}
