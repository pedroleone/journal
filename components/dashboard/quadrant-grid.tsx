import type { ReactNode } from "react";

interface QuadrantGridProps {
  main: ReactNode;
  sidebar: ReactNode;
}

export function QuadrantGrid({ main, sidebar }: QuadrantGridProps) {
  return (
    <div className="flex flex-1 flex-col gap-px bg-border md:flex-row">
      <div className="flex flex-1 flex-col gap-px md:w-3/5">{main}</div>
      <div className="flex flex-1 flex-col gap-px md:w-2/5">{sidebar}</div>
    </div>
  );
}
