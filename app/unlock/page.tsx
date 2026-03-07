"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PassphrasePrompt, type PassphrasePromptMode, type ValidationEntry } from "@/components/passphrase-prompt";
import { normalizeUnlockNext } from "@/lib/unlock";

export default function UnlockPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<PassphrasePromptMode | null>(null);
  const [entry, setEntry] = useState<ValidationEntry | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUnlockState() {
      try {
        const res = await fetch("/api/entries/oldest");
        if (!res.ok) throw new Error("Failed to load unlock state");

        const data = await res.json();
        if (cancelled) return;

        setEntry(data.entry ?? null);
        setMode(data.entry ? "existing-user" : "first-user");
      } catch {
        if (!cancelled) {
          setError("Unable to load unlock state");
        }
      }
    }

    void loadUnlockState();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleUnlock() {
    const nextPath = normalizeUnlockNext(searchParams.get("next"));
    router.replace(nextPath);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="animate-page w-full max-w-xs space-y-8">
        <div className="text-center">
          <h1 className="font-display text-4xl tracking-tight">Unlock</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your encryption passphrase to decrypt your journal locally.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : mode ? (
          <PassphrasePrompt
            mode={mode}
            validationEntry={entry}
            onUnlock={handleUnlock}
          />
        ) : (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
