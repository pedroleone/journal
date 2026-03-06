"use client";

import { PassphrasePrompt } from "@/components/passphrase-prompt";

interface LockScreenProps {
  onUnlock: (key: CryptoKey) => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="w-full max-w-xs space-y-6 px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-tight">Locked</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your passphrase to unlock
          </p>
        </div>
        <PassphrasePrompt onUnlock={onUnlock} />
      </div>
    </div>
  );
}
