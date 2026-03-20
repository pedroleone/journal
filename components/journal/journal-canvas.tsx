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
        "mx-auto w-full max-w-[760px] rounded-[32px] border border-border/60 bg-card/30 px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:px-8 sm:py-9",
        className,
      )}
    >
      {meta ? (
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {meta}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
          {heading}
        </h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="mt-8">{body}</div>

      {footer ? (
        <div className="mt-8 border-t border-border/40 pt-4 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
