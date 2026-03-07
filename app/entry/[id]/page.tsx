"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { decrypt, encrypt } from "@/lib/crypto";
import { getKey } from "@/lib/key-manager";
import { useRequireUnlock } from "@/hooks/use-require-unlock";

interface Entry {
  id: string;
  year: number;
  month: number;
  day: number;
  encrypted_content: string;
  iv: string;
  created_at: string;
  updated_at: string;
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
  const hasKey = useRequireUnlock();

  useEffect(() => {
    if (!hasKey) return;

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
  }, [hasKey, id]);

  useEffect(() => {
    if (!hasKey) return;
    if (!entry) return;
    const key = getKey();
    if (!key) {
      return;
    }
    decrypt(key, entry.encrypted_content, entry.iv)
      .then((text) => {
        setDecryptedContent(text);
        setEditContent(text);
      })
      .catch(() => setDecryptedContent("[decryption failed]"));
  }, [entry, hasKey]);

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

  if (!hasKey) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="animate-page mx-auto max-w-2xl px-6 py-10">
        <p className="text-muted-foreground">Entry not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/browse")}>
          Back to Browse
        </Button>
      </div>
    );
  }

  const dateStr = `${MONTH_NAMES[entry.month]} ${entry.day}, ${entry.year}`;

  return (
    <div className="animate-page mx-auto max-w-2xl px-6 py-10 space-y-8">
      <button
        onClick={() => router.push("/browse")}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back
      </button>

      <div>
        <h1 className="font-display text-2xl tracking-tight">{dateStr}</h1>
      </div>

      {editing ? (
        <div className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={12}
            className="resize-none border-border/50 bg-card text-base leading-relaxed focus-visible:ring-1"
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
        <div className="space-y-6">
          {decryptedContent === null ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : (
            <div className="whitespace-pre-wrap text-base leading-relaxed">
              {decryptedContent}
            </div>
          )}
          <div className="flex gap-2 border-t pt-6">
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
