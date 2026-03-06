"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { encrypt } from "@/lib/crypto";
import { getKey, initActivityListeners, onLock } from "@/lib/key-manager";
import { useVisibilityLock } from "@/hooks/use-visibility-lock";
import { LockScreen } from "@/components/lock-screen";
import { PassphrasePrompt } from "@/components/passphrase-prompt";

type EntryType = "journal" | "food" | "idea" | "note";

export default function WritePage() {
  const [type, setType] = useState<EntryType>("journal");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const { isLocked, setIsLocked } = useVisibilityLock();

  useEffect(() => {
    const cleanup = initActivityListeners();
    onLock(() => setIsLocked(true));
    return cleanup;
  }, [setIsLocked]);

  const handleSave = useCallback(
    async (key?: CryptoKey) => {
      const cryptoKey = key ?? getKey();
      if (!cryptoKey) {
        setNeedsPassphrase(true);
        return;
      }

      setSaving(true);
      setMessage("");
      try {
        const now = new Date();
        const { ciphertext, iv } = await encrypt(cryptoKey, content);

        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            encrypted_content: ciphertext,
            iv,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: now.getHours(),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setMessage(`Error: ${data.error || "Failed to save"}`);
        } else {
          setMessage("Saved");
          setContent("");
        }
      } catch {
        setMessage("Error: Failed to save entry");
      } finally {
        setSaving(false);
      }
    },
    [content, type],
  );

  function handleUnlockFromLock(key: CryptoKey) {
    setIsLocked(false);
  }

  function handleUnlockInline(key: CryptoKey) {
    setNeedsPassphrase(false);
    handleSave(key);
  }

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlockFromLock} />;
  }

  return (
    <div className="animate-page mx-auto max-w-2xl px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tight">Write</h1>
        <Select value={type} onValueChange={(v) => setType(v as EntryType)}>
          <SelectTrigger className="w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="journal">Journal</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="note">Note</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind..."
        rows={12}
        className="resize-none border-border/50 bg-card text-base leading-relaxed focus-visible:ring-1"
      />

      {needsPassphrase && (
        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Session expired. Enter your passphrase to save.
          </p>
          <PassphrasePrompt
            onUnlock={handleUnlockInline}
            onCancel={() => setNeedsPassphrase(false)}
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          onClick={() => handleSave()}
          disabled={saving || !content}
        >
          {saving ? "Saving..." : "Save Entry"}
        </Button>
        {message && (
          <p
            className={`text-sm ${message.startsWith("Error") ? "text-destructive" : "text-muted-foreground"}`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
