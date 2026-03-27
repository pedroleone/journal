import type { ReactNode } from "react";

interface QuadrantGridProps {
  children: ReactNode;
}

export function QuadrantGrid({ children }: QuadrantGridProps) {
  return (
    <div className="grid flex-1 grid-cols-1 gap-px bg-border md:min-h-0 md:grid-cols-3">
      {children}
    </div>
  );
}
