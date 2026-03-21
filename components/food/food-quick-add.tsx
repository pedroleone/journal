"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FoodInlineComposer } from "@/components/food/food-inline-composer";

interface FoodQuickAddProps {
  year: number;
  month: number;
  day: number;
  onSaved: () => void | Promise<void>;
}

export function FoodQuickAdd({ year, month, day, onSaved }: FoodQuickAddProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={() => setOpen((current) => !current)}>
        Quick Add
      </Button>
      {open ? (
        <FoodInlineComposer
          year={year}
          month={month}
          day={day}
          onSaved={async () => {
            setOpen(false);
            await onSaved();
          }}
        />
      ) : null}
    </div>
  );
}
