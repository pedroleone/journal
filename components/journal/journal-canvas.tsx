"use client";

import { cn } from "@/lib/utils";

interface JournalCanvasProps {
  heading: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function JournalCanvas({
  heading,
  meta,
  actions,
  body,
  footer,
  className,
}: JournalCanvasProps) {
  return (
    <section
      className={cn(
        "journal-browse-shell mx-auto w-full max-w-[760px] rounded-[28px] border border-border/50 bg-card/20 px-6 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.12)] sm:px-8 sm:py-8",
        className,
      )}
    >
      {meta ? (
        <div className="journal-browse-meta mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
          {meta}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="font-display text-[2rem] leading-tight tracking-tight text-foreground sm:text-[2.25rem]">
          {heading}
        </h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="journal-browse-body mt-7">{body}</div>

      {footer ? (
        <div className="journal-browse-footer mt-8 border-t border-border/40 pt-4 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
