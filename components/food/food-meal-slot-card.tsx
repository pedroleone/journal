import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EncryptedImageGallery } from "@/components/encrypted-image-gallery";
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
  onAdd?: () => void;
  onSkip?: () => void;
  onUndoSkip?: () => void;
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
  onAdd,
  onSkip,
  onUndoSkip,
}: FoodMealSlotCardProps) {
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
          <Button variant="outline" size="sm" onClick={onAdd} aria-label={`Add ${slotLabel}`}>
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
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--food)]">
          {slotLabel}
        </h2>
      </div>
      <div className="mt-3 space-y-3">
        {state.entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border border-border/50 bg-background/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed">{entry.content || "Photo entry"}</p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatSlotTime(entry.logged_at, entry.hour)}
              </span>
            </div>
            {entry.images?.length ? (
              <EncryptedImageGallery
                imageKeys={entry.images}
                className="mt-3"
                imageClassName="h-28"
              />
            ) : null}
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/food/entry/${entry.id}?edit=true`}>Edit</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/food/entry/${entry.id}`}>Open</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
