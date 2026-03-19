"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { DateNavigator } from "@/components/shared/date-navigator";

interface TopBarProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function TopBar({ date, onDateChange }: TopBarProps) {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-background px-4 dark:bg-[var(--bg-topbar)]">
      <DateNavigator date={date} onDateChange={onDateChange} />
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
