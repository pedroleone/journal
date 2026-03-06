"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PassphrasePrompt } from "@/components/passphrase-prompt";

interface LockScreenProps {
  onUnlock: (key: CryptoKey) => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Session Locked</CardTitle>
          <CardDescription>
            Enter your passphrase to unlock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PassphrasePrompt onUnlock={onUnlock} />
        </CardContent>
      </Card>
    </div>
  );
}
