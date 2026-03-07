"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { wipeKeys } from "@/lib/key-manager";

export default function SettingsPage() {
  const router = useRouter();
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
          Export encrypted backups, restore from a backup file, lock the app immediately, and keep Telegram commands close at hand.
        </p>
      </header>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">Security</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Wipe the in-memory encryption keys and return to the unlock screen.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            wipeKeys();
            router.push("/unlock");
          }}
        >
          Lock now
        </Button>
      </section>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">Data export</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose decrypted text export formats or download a full encrypted backup.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/export">Open export tools</Link>
        </Button>
      </section>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">Restore backup</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Restore from an encrypted backup JSON file. Existing entry IDs are skipped.
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
