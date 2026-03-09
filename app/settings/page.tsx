"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface TelegramLinkState {
  linked: boolean;
  chatId: string | null;
}

interface TokenState {
  token: string;
  deepLink: string | null;
  expiresAt: string;
}

function TelegramSection() {
  const [linkState, setLinkState] = useState<TelegramLinkState | null>(null);
  const [tokenState, setTokenState] = useState<TokenState | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchLinkState() {
    const res = await fetch("/api/telegram/link");
    if (res.ok) {
      const data = (await res.json()) as TelegramLinkState;
      setLinkState(data);
      return data;
    }
    return null;
  }

  useEffect(() => {
    void fetchLinkState();
  }, []);

  useEffect(() => {
    if (tokenState && linkState && !linkState.linked) {
      pollRef.current = setInterval(async () => {
        const data = await fetchLinkState();
        if (data?.linked) {
          setTokenState(null);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tokenState, linkState]);

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/link/token", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as TokenState;
        setTokenState(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await fetch("/api/telegram/link", { method: "DELETE" });
      setLinkState({ linked: false, chatId: null });
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }

  const botUsername = tokenState?.deepLink
    ? tokenState.deepLink.match(/t\.me\/([^?]+)/)?.[1]
    : null;

  return (
    <section className="rounded-xl border border-border/60 bg-card/30 p-6">
      <h2 className="font-display text-2xl tracking-tight">Telegram</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Connect your Telegram account to log food entries from the bot.
      </p>

      {linkState === null ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : linkState.linked ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-green-600 dark:text-green-400">Connected</p>
          <Button variant="outline" onClick={() => void handleDisconnect()} disabled={loading}>
            Disconnect
          </Button>
        </div>
      ) : tokenState ? (
        <div className="mt-4 space-y-3">
          {tokenState.deepLink ? (
            <Button asChild>
              <a href={tokenState.deepLink} target="_blank" rel="noopener noreferrer">
                Open {botUsername ? `@${botUsername}` : "bot"} in Telegram
              </a>
            </Button>
          ) : null}
          <p className="text-sm text-muted-foreground">
            or send <code>/start {tokenState.token}</code>
            {botUsername ? ` to @${botUsername}` : " to the bot"} manually
          </p>
          <p className="text-sm text-muted-foreground">
            Waiting for confirmation…
          </p>
          <Button variant="outline" onClick={() => void handleConnect()} disabled={loading}>
            Generate new code
          </Button>
        </div>
      ) : (
        <Button className="mt-4" onClick={() => void handleConnect()} disabled={loading}>
          Connect Telegram
        </Button>
      )}
    </section>
  );
}

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");

  async function handleRestore(file: File | null) {
    if (!file) return;

    setRestoring(true);
    setRestoreMessage("");

    try {
      const payload = JSON.parse(await file.text());
      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Restore failed");
      }

      const data = await response.json();
      setRestoreMessage(
        `Imported ${data.imported_journal} journal, ${data.imported_food} food, ${data.imported_images} images.`,
      );
    } catch {
      setRestoreMessage("Restore failed.");
    } finally {
      setRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="animate-page mx-auto max-w-3xl space-y-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Settings
        </p>
        <h1 className="font-display text-4xl tracking-tight">Journal controls</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Export backups, restore from a backup file, and keep Telegram commands close at hand.
        </p>
      </header>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">Data export</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose text export formats or download a full backup JSON file.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/export">Open export tools</Link>
        </Button>
      </section>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">Restore backup</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Restore from a version 2 backup JSON file. Existing entry IDs are skipped.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="mt-4 block text-sm text-muted-foreground"
          onChange={(event) => {
            void handleRestore(event.target.files?.[0] ?? null);
          }}
        />
        {restoring ? <p className="mt-3 text-sm text-muted-foreground">Restoring…</p> : null}
        {restoreMessage ? <p className="mt-3 text-sm text-muted-foreground">{restoreMessage}</p> : null}
      </section>

      <TelegramSection />

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">Telegram commands</h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <p><code>/food</code> saves a food entry.</p>
          <p>Messages without a command also save as food entries.</p>
          <p><code>/journal</code>, <code>/idea</code>, and <code>/note</code> are intentionally unsupported.</p>
          <p>Photos can be sent with or without <code>/food</code> and land in uncategorized food.</p>
        </div>
      </section>
    </div>
  );
}
