"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { initActivityListeners, onLock, getKey } from "@/lib/key-manager";
import { decrypt, encrypt } from "@/lib/crypto";
import { useVisibilityLock } from "@/hooks/use-visibility-lock";
import { LockScreen } from "@/components/lock-screen";
import { PassphrasePrompt } from "@/components/passphrase-prompt";

interface FoodEntry {
  id: string;
  encrypted_content: string;
  iv: string;
  logged_at: string;
}

interface RecentEntry {
  id: string;
  content: string;
  logged_at: string;
}

function formatLoggedAt(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FoodPage() {
  const [content, setContent] = useState("");
  const [logging, setLogging] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [hasKey, setHasKey] = useState(() => !!getKey());
  const [savedFlash, setSavedFlash] = useState(false);
  const { isLocked, setIsLocked } = useVisibilityLock();

  useEffect(() => {
    const cleanup = initActivityListeners();
    onLock(() => setIsLocked(true));
    return cleanup;
  }, [setIsLocked]);

  const loadRecent = useCallback(async () => {
    const key = getKey();
    if (!key) return;

    try {
      const res = await fetch("/api/food?uncategorized=true&limit=5");
      if (!res.ok) return;
      const raw: FoodEntry[] = await res.json();

      const decrypted = await Promise.all(
        raw.map(async (entry) => {
          const text = await decrypt(key, entry.encrypted_content, entry.iv);
          return {
            id: entry.id,
            content: text,
            logged_at: entry.logged_at,
          };
        }),
      );

      setRecent(decrypted);
    } catch {
      // Ignore feed failures to keep quick-log usable.
    }
  }, []);

  useEffect(() => {
    if (!hasKey) return;
    loadRecent();
  }, [hasKey, loadRecent]);

  async function handleLog() {
    if (!content.trim()) return;

    const key = getKey();
    if (!key) {
      setHasKey(false);
      return;
    }

    setLogging(true);
    try {
      const { ciphertext, iv } = await encrypt(key, content.trim());
      const res = await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encrypted_content: ciphertext,
          iv,
        }),
      });
      if (!res.ok) return;
      setContent("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
      await loadRecent();
    } finally {
      setLogging(false);
    }
  }

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  if (!hasKey) {
    return (
      <div className="animate-page mx-auto max-w-sm px-6 py-20 space-y-6">
        <div className="text-center">
          <h1 className="font-display text-2xl tracking-tight">Food</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your passphrase to log food entries.
          </p>
        </div>
        <PassphrasePrompt onUnlock={() => setHasKey(true)} />
      </div>
    );
  }

  return (
    <div className="animate-page mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/food/browse?mode=food">Browse & Organize</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/30 p-4 sm:p-6 space-y-4">
        <h1 className="font-display text-2xl tracking-tight">Quick Food Log</h1>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are you eating?"
          rows={4}
          className="resize-none border-border/50 bg-background/70"
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            One field, one tap.
          </div>
          <Button onClick={handleLog} disabled={logging || !content.trim()}>
            {logging ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              "Log"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent uncategorized
          </h2>
          {savedFlash && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No food logs yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-border/50 bg-card/20 px-3 py-2"
              >
                <p className="text-sm leading-relaxed">{entry.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatLoggedAt(entry.logged_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
