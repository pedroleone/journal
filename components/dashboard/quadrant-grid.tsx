import type { ReactNode } from "react";

export function QuadrantGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid flex-1 grid-cols-1 gap-px bg-border md:grid-cols-2">
      {children}
    </div>
  );
}
