"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { EncryptedImageGallery } from "@/components/encrypted-image-gallery";
import type { MealSlot } from "@/lib/food";
import { useLocale } from "@/hooks/use-locale";

type InboxEntry = {
  id: string;
  content: string;
  logged_at: string;
  images: string[] | null;
};

interface FoodInboxPanelProps {
  entries: InboxEntry[];
  mealSlots: Array<{ value: MealSlot; label: string }>;
  onAssignEntry: (entryId: string, mealSlot: MealSlot | null) => void | Promise<void>;
  onDeleteEntry?: (entryId: string) => void | Promise<void>;
  returnTo?: string;
}

export function FoodInboxPanel({
  entries,
  mealSlots,
  onAssignEntry,
  onDeleteEntry,
  returnTo,
}: FoodInboxPanelProps) {
  const { t } = useLocale();
  const [selectedSlots, setSelectedSlots] = useState<Record<string, MealSlot | "">>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const organizerBusy = assigningId !== null || deletingId !== null;

  useEffect(() => {
    setSelectedSlots((current) => {
      const next: Record<string, MealSlot | ""> = {};
      for (const entry of entries) {
        next[entry.id] = current[entry.id] ?? "";
      }
      return next;
    });
  }, [entries]);

  function formatLoggedAt(loggedAt: string) {
    return new Date(loggedAt).toLocaleString(t.localeCode, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    setConfirmDeleteId((current) =>
      current && entries.some((entry) => entry.id === current) ? current : null,
    );
  }, [entries]);

  async function handleAssign(entryId: string) {
    const selectedSlot = selectedSlots[entryId];
    if (!selectedSlot) return;

    setAssigningId(entryId);
    try {
      await onAssignEntry(entryId, selectedSlot);
    } finally {
      setAssigningId((current) => (current === entryId ? null : current));
    }
  }

  async function handleDelete(entryId: string) {
    if (!onDeleteEntry) return;

    setDeletingId(entryId);
    try {
      await onDeleteEntry(entryId);
    } finally {
      setDeletingId((current) => (current === entryId ? null : current));
      setConfirmDeleteId((current) => (current === entryId ? null : current));
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-border/60 bg-card/30 p-4">
        <h2 className="text-lg font-semibold tracking-tight">{t.food.uncategorizedEntries}</h2>
      </div>
      {entries.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card/20 p-4 text-sm text-muted-foreground">
          {t.food.noUncategorizedEntries}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-3xl border border-border/60 bg-card/30 p-4">
              <p className="text-sm leading-relaxed">{entry.content || t.food.photoEntry}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatLoggedAt(entry.logged_at)}</p>
              {entry.images?.length ? (
                <EncryptedImageGallery
                  imageKeys={entry.images}
                  className="mt-3"
                  imageClassName="h-28"
                />
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={!selectedSlots[entry.id] || organizerBusy}
                  onClick={() => void handleAssign(entry.id)}
                >
                  {t.food.assignToSelectedDay(entry.content || "entry")}
                </Button>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{t.food.mealSlot}</span>
                  <select
                    aria-label={`${t.food.mealSlot} ${entry.content || "entry"}`}
                    value={selectedSlots[entry.id] ?? ""}
                    onChange={(event) =>
                      setSelectedSlots((current) => ({
                        ...current,
                        [entry.id]: event.target.value as MealSlot | "",
                      }))
                    }
                    disabled={organizerBusy}
                    className="rounded-md border border-border/60 bg-background px-2 py-1 text-sm text-foreground"
                  >
                    <option value="">{t.food.noSlot}</option>
                    {mealSlots.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={
                      returnTo
                        ? `/food/entry/${entry.id}?returnTo=${encodeURIComponent(returnTo)}`
                        : `/food/entry/${entry.id}`
                    }
                  >
                    {t.food.open}
                  </Link>
                </Button>
                {onDeleteEntry ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled={organizerBusy}
                    aria-label={`${t.food.delete} ${entry.content || "entry"}`}
                    onClick={() => setConfirmDeleteId(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        onConfirm={() => { if (confirmDeleteId) void handleDelete(confirmDeleteId); }}
        title="Delete food entry"
        description="This food entry will be permanently deleted. This action cannot be undone."
      />
    </section>
  );
}
