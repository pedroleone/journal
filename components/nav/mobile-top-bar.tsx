"use client";

import { Moon, Settings, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { NAV_SECTIONS } from "@/components/nav/nav-sections";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { useMode } from "@/lib/mode-context";

export function MobileTopBar() {
  const router = useRouter();
  const { mode } = useMode();
  const { t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const currentSection = NAV_SECTIONS.find((section) => section.key === mode) ?? NAV_SECTIONS[0];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="flex h-12 items-center justify-between px-4">
        <p className="font-display text-lg tracking-tight text-foreground">
          {t.nav[currentSection.i18nKeys.label]}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
