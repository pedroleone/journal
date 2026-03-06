"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { decrypt, encrypt } from "@/lib/crypto";
import { getKey, initActivityListeners, onLock } from "@/lib/key-manager";
import { useVisibilityLock } from "@/hooks/use-visibility-lock";
import { LockScreen } from "@/components/lock-screen";
import { PassphrasePrompt } from "@/components/passphrase-prompt";

interface Entry {
  id: string;
  type: string;
  year: number;
  month: number;
  day: number;
  encrypted_content: string;
  iv: string;
  created_at: string;
  updated_at: string;
}

export default function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const { isLocked, setIsLocked } = useVisibilityLock();

  useEffect(() => {
    const cleanup = initActivityListeners();
    onLock(() => {
      setIsLocked(true);
      setDecryptedContent(null);
    });
    return cleanup;
  }, [setIsLocked]);

  useEffect(() => {
    fetch(`/api/entries/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setEntry(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!entry) return;
    const key = getKey();
    if (!key) {
      setNeedsPassphrase(true);
      return;
    }
    decrypt(key, entry.encrypted_content, entry.iv)
      .then((text) => {
        setDecryptedContent(text);
        setEditContent(text);
      })
      .catch(() => setDecryptedContent("[decryption failed]"));
  }, [entry, isLocked]);

  async function handleSave() {
    const key = getKey();
    if (!key || !entry) return;
    setSaving(true);
    try {
      const { ciphertext, iv } = await encrypt(key, editContent);
      const res = await fetch(`/api/entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encrypted_content: ciphertext, iv }),
      });
      if (res.ok) {
        setEntry({ ...entry, encrypted_content: ciphertext, iv, updated_at: new Date().toISOString() });
        setDecryptedContent(editContent);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    router.push("/browse");
  }

  function handleUnlock() {
    setIsLocked(false);
    setNeedsPassphrase(false);
    // Re-trigger decrypt
    if (entry) {
      const key = getKey();
      if (key) {
        decrypt(key, entry.encrypted_content, entry.iv)
          .then((text) => {
            setDecryptedContent(text);
            setEditContent(text);
          })
          .catch(() => setDecryptedContent("[decryption failed]"));
      }
    }
  }

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-muted-foreground">Entry not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/browse")}>
          Back to Browse
        </Button>
      </div>
    );
  }

  if (needsPassphrase) {
    return (
      <div className="mx-auto max-w-2xl p-6 space-y-6">
        <h1 className="text-2xl font-bold">Entry</h1>
        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Enter your passphrase to decrypt this entry.
          </p>
          <PassphrasePrompt onUnlock={handleUnlock} />
        </div>
      </div>
    );
  }

  const dateStr = `${entry.year}-${String(entry.month).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/browse")}>
          &larr; Browse
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary">{entry.type}</Badge>
        <span className="text-sm text-muted-foreground">{dateStr}</span>
      </div>

      <Separator />

      {editing ? (
        <div className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={10}
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={() => { setEditing(false); setEditContent(decryptedContent ?? ""); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {decryptedContent === null ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="whitespace-pre-wrap">{decryptedContent}</div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
