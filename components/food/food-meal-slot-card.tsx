"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EncryptedImageGallery } from "@/components/encrypted-image-gallery";
import { FoodInlineComposer } from "@/components/food/food-inline-composer";
import type { MealSlot } from "@/lib/food";

type FilledEntry = {
  id: string;
  content: string;
  logged_at: string;
  images: string[] | null;
  hour: number | null;
};

type EmptyState = {
  kind: "empty";
  entries: [];
};

type SkippedState = {
  kind: "skipped";
  skippedEntry: {
    id: string;
    meal_slot: MealSlot | null;
    tags: string[] | null;
  };
  entries: [];
};

type FilledState = {
  kind: "filled";
  entries: FilledEntry[];
};

type MealSlotCardState = EmptyState | SkippedState | FilledState;

interface FoodMealSlotCardProps {
  slot: MealSlot;
  slotLabel: string;
  state: MealSlotCardState;
  canSkip?: boolean;
  year?: number;
  month?: number;
  day?: number;
  onAdd?: () => void;
  onSkip?: () => void;
  onUndoSkip?: () => void;
  onDeleteEntry?: (entryId: string) => void | Promise<void>;
  onEntrySaved?: (entryId: string) => void | Promise<void>;
  returnTo?: string;
}

function formatSlotTime(loggedAt: string, hour: number | null) {
  if (hour !== null) {
    return `${String(hour).padStart(2, "0")}:00`;
  }

  return new Date(loggedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FoodMealSlotCard({
  slot,
  slotLabel,
  state,
  canSkip = false,
  year,
  month,
  day,
  onAdd,
  onSkip,
  onUndoSkip,
  onDeleteEntry,
  onEntrySaved,
  returnTo,
}: FoodMealSlotCardProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const hasComposerContext = year !== undefined && month !== undefined && day !== undefined;

  function handleAddClick() {
    if (hasComposerContext) {
      setComposerOpen(true);
      return;
    }

    onAdd?.();
  }

  function handleCloseComposer() {
    setComposerOpen(false);
  }

  async function handleComposerSaved(entryId: string) {
    await onEntrySaved?.(entryId);
    setComposerOpen(false);
  }

  if (state.kind === "skipped") {
    return (
      <section className="rounded-3xl border border-border/60 bg-card/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--food)]">
            {slotLabel}
          </h2>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            Skipped
          </span>
        </div>
        <div className="mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndoSkip}
            aria-label={`Undo skip ${slotLabel.toLowerCase()}`}
          >
            Undo
          </Button>
        </div>
      </section>
    );
  }

  if (state.kind === "empty") {
    return (
      <section className="rounded-3xl border border-dashed border-border/60 bg-card/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--food)]">
            {slotLabel}
          </h2>
        </div>
        <div className="mt-10 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAddClick} aria-label={`Add ${slotLabel}`}>
            Add
          </Button>
          {canSkip ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              aria-label={`Skip ${slotLabel}`}
            >
              Skip
            </Button>
          ) : null}
        </div>
        {composerOpen && hasComposerContext ? (
          <div className="mt-4 space-y-3">
            <FoodInlineComposer
              year={year}
              month={month}
              day={day}
              mealSlot={slot}
              onSaved={handleComposerSaved}
            />
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleCloseComposer}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--food)]">
          {slotLabel}
        </h2>
        {hasComposerContext ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddClick}
            aria-label={`Add another ${slotLabel}`}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add another
          </Button>
        ) : null}
      </div>
      {composerOpen && hasComposerContext ? (
        <div className="mt-4 space-y-3">
          <FoodInlineComposer
            year={year}
            month={month}
            day={day}
            mealSlot={slot}
            onSaved={handleComposerSaved}
          />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleCloseComposer}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      <div className="mt-3 space-y-3">
        {state.entries.map((entry) => (
          <FoodMealSlotEntryRow
            key={entry.id}
            entry={entry}
            onDeleteEntry={onDeleteEntry}
            returnTo={returnTo}
          />
        ))}
      </div>
    </section>
  );
}

interface FoodMealSlotEntryRowProps {
  entry: FilledEntry;
  onDeleteEntry?: (entryId: string) => void | Promise<void>;
  returnTo?: string;
}

function FoodMealSlotEntryRow({ entry, onDeleteEntry, returnTo }: FoodMealSlotEntryRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const entryHref = returnTo
    ? `/food/entry/${entry.id}?returnTo=${encodeURIComponent(returnTo)}`
    : `/food/entry/${entry.id}`;
  const editHref = returnTo
    ? `${entryHref}&edit=true`
    : `/food/entry/${entry.id}?edit=true`;

  async function handleDelete() {
    if (!onDeleteEntry) return;

    setConfirmDelete(false);
    await onDeleteEntry(entry.id);
  }

  return (
    <article key={entry.id} className="rounded-2xl border border-border/50 bg-background/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed">{entry.content || "Photo entry"}</p>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatSlotTime(entry.logged_at, entry.hour)}
        </span>
      </div>
      {entry.images?.length ? (
        <EncryptedImageGallery imageKeys={entry.images} className="mt-3" imageClassName="h-28" />
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={editHref}>Edit</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={entryHref}>Open</Link>
        </Button>
        {onDeleteEntry ? (
          confirmDelete ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => void handleDelete()}>
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )
        ) : null}
      </div>
    </article>
  );
}
