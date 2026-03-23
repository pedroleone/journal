"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EncryptedImageGallery } from "@/components/encrypted-image-gallery";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface Entry {
  id: string;
  source: "web";
  year: number;
  month: number;
  day: number;
  content: string;
  created_at: string;
  updated_at: string;
  images: string[] | null;
}

interface EntryDate {
  id: string;
  year: number;
  month: number;
  day: number;
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function compareEntryDates(left: EntryDate, right: EntryDate): number {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

export default function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [entryDates, setEntryDates] = useState<EntryDate[]>([]);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [readyForViewing, setReadyForViewing] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) return;

    Promise.all([
      fetch(`/api/entries/${id}`).then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      }),
      fetch("/api/entries/dates")
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .catch(() => []),
    ])
      .then(([entryData, dateData]) => {
        setEntry(entryData);
        setEditContent(entryData.content);
        setEntryDates(dateData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      })
      .finally(() => {
        setReadyForViewing(true);
      });
  }, [id, isOnline]);

  async function handleSave() {
    if (!entry || !isOnline) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEntry({ ...entry, content: editContent, updated_at: new Date().toISOString() });
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isOnline) return;
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    router.push("/journal/browse");
  }

  if (!isOnline && !readyForViewing) {
    return (
      <div className="mx-auto flex min-h-full max-w-md items-center justify-center px-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl tracking-tight">Connection required</h1>
          <p className="text-sm text-muted-foreground">
            The installed app opens offline, but loading or changing an entry still requires a connection.
          </p>
        </div>
      </div>
    );
  }

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
        <Button variant="outline" className="mt-4" onClick={() => router.push("/journal/browse")}>
          Back to Browse
        </Button>
      </div>
    );
  }

  const dateStr = `${MONTH_NAMES[entry.month]} ${entry.day}, ${entry.year}`;
  const sortedEntryDates = [...entryDates].sort(compareEntryDates);
  const entryIndex = sortedEntryDates.findIndex((date) => date.id === entry.id);
  const previousEntryId = entryIndex > 0 ? sortedEntryDates[entryIndex - 1]?.id ?? null : null;
  const nextEntryId =
    entryIndex >= 0 && entryIndex < sortedEntryDates.length - 1
      ? sortedEntryDates[entryIndex + 1]?.id ?? null
      : null;

  return (
    <div className="animate-page mx-auto max-w-2xl px-6 py-10 space-y-8">
      {!isOnline && (
        <div className="rounded-lg border border-border/60 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          You are offline. This entry stays visible, but edits and deletes are unavailable until you reconnect.
        </div>
      )}
      <button
        onClick={() => router.push("/journal/browse")}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back
      </button>

      <div>
        <h1 className="font-display text-2xl tracking-tight">{dateStr}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 pb-5">
        <Button
          variant="outline"
          onClick={() => setEditing(true)}
          disabled={!isOnline || editing}
        >
          Edit Entry
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={!isOnline}>
          Delete Entry
        </Button>
        {previousEntryId ? (
          <Link
            href={`/journal/entry/${previousEntryId}`}
            className="inline-flex items-center rounded-full border border-border/60 px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary/50"
          >
            Previous Entry
          </Link>
        ) : null}
        {nextEntryId ? (
          <Link
            href={`/journal/entry/${nextEntryId}`}
            className="inline-flex items-center rounded-full border border-border/60 px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary/50"
          >
            Next Entry
          </Link>
        ) : null}
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
            <Button onClick={handleSave} disabled={saving || !isOnline}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={() => { setEditing(false); setEditContent(entry.content); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="whitespace-pre-wrap text-base leading-relaxed">
            {entry.content}
          </div>
          {entry.images?.length ? (
            <EncryptedImageGallery imageKeys={entry.images} />
          ) : null}
        </div>
      )}
    </div>
  );
}
