import type { MealSlot } from "@/lib/food";

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  morning_snack: "Morning Snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon Snack",
  dinner: "Dinner",
  midnight_snack: "Late Snack",
  observation: "Observation",
};

interface MealRowProps {
  slot: MealSlot;
  description: string;
  time?: string;
}

export function MealRow({ slot, description, time }: MealRowProps) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <span className="shrink-0 text-xs font-medium text-[var(--food)]">
        {SLOT_LABELS[slot]}
      </span>
      <span className="flex-1 truncate text-muted-foreground">
        {description}
      </span>
      {time && (
        <span className="shrink-0 text-xs text-muted-foreground/60">
          {time}
        </span>
      )}
    </div>
  );
}
