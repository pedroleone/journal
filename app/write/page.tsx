"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
          setMessage("Entry saved!");
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
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Write</h1>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as EntryType)}>
          <SelectTrigger className="w-48">
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

      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your entry..."
          rows={10}
        />
      </div>

      {needsPassphrase && (
        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Your session key expired. Enter your passphrase to save.
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
