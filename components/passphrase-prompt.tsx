"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deriveKey, decrypt } from "@/lib/crypto";
import { setKey } from "@/lib/key-manager";

export type PassphrasePromptMode = "existing-user" | "first-user";

export interface ValidationEntry {
  encrypted_content: string;
  iv: string;
}

interface PassphrasePromptProps {
  mode: PassphrasePromptMode;
  validationEntry?: ValidationEntry | null;
  onUnlock: (key: CryptoKey) => void;
  onCancel?: () => void;
}

export function PassphrasePrompt({
  mode,
  validationEntry = null,
  onUnlock,
  onCancel,
}: PassphrasePromptProps) {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passphrase) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "first-user" && passphrase !== confirmPassphrase) {
        setError("Passphrases do not match");
        setLoading(false);
        return;
      }

      const key = await deriveKey(passphrase);

      if (mode === "existing-user" && validationEntry) {
        try {
          await decrypt(
            key,
            validationEntry.encrypted_content,
            validationEntry.iv,
          );
        } catch {
          setError("Incorrect passphrase — please try again");
          setLoading(false);
          return;
        }
      }

      setKey(key);
      onUnlock(key);
    } catch {
      setError("Failed to derive key");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="passphrase" className="text-xs uppercase tracking-wider text-muted-foreground">
          Passphrase
        </Label>
        <Input
          id="passphrase"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Enter your passphrase"
          autoFocus
          className="bg-card"
        />
      </div>
      {mode === "first-user" && (
        <div className="space-y-2">
          <Label
            htmlFor="confirm-passphrase"
            className="text-xs uppercase tracking-wider text-muted-foreground"
          >
            Confirm Passphrase
          </Label>
          <Input
            id="confirm-passphrase"
            type="password"
            value={confirmPassphrase}
            onChange={(e) => setConfirmPassphrase(e.target.value)}
            placeholder="Confirm your passphrase"
            className="bg-card"
          />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={
            loading ||
            !passphrase ||
            (mode === "first-user" && !confirmPassphrase)
          }
        >
          {loading ? "Unlocking..." : "Unlock"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
