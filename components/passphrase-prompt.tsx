"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deriveKey } from "@/lib/crypto";
import { setKey } from "@/lib/key-manager";

interface PassphrasePromptProps {
  onUnlock: (key: CryptoKey) => void;
  onCancel?: () => void;
}

export function PassphrasePrompt({ onUnlock, onCancel }: PassphrasePromptProps) {
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passphrase) return;
    setLoading(true);
    setError("");
    try {
      const key = await deriveKey(passphrase);
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
        <Label htmlFor="passphrase">Encryption Passphrase</Label>
        <Input
          id="passphrase"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Enter your passphrase"
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !passphrase}>
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
