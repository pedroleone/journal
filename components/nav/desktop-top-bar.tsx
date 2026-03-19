"use client";

import { LogOut, Moon, Plus, Settings, Sun } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { NAV_SECTIONS, useCreateHandlers } from "@/components/nav/nav-sections";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { useMode, type Mode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";

const CREATE_HANDLER_BY_MODE: Record<Mode, keyof ReturnType<typeof useCreateHandlers>> = {
  journal: "createJournal",
  food: "createFood",
  notes: "createNote",
  library: "createLibrary",
};

export function DesktopTopBar() {
  const router = useRouter();
  const { mode } = useMode();
  const { t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const createHandlers = useCreateHandlers();

  async function handleLogout() {
    await signOut({ redirectTo: "/login" });
  }

  function handleCreate(modeKey: Mode) {
    return createHandlers[CREATE_HANDLER_BY_MODE[modeKey]]();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-1">
          {NAV_SECTIONS.map((section) => {
            const isActive = mode === section.key;
            const Icon = section.icon;

            return (
              <div
                key={section.key}
                className="flex overflow-hidden rounded-md border border-border/60 bg-background/80"
              >
                <button
                  type="button"
                  onClick={() => router.push(section.browseRoute)}
                  aria-label={t.nav[section.i18nKeys.browse]}
                  aria-current={isActive ? "page" : undefined}
                  title={t.nav[section.i18nKeys.browse]}
                  className={cn(
                    "flex h-9 items-center gap-2 px-3 text-sm transition-colors",
                    isActive
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.nav[section.i18nKeys.label]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreate(section.key)}
                  aria-label={t.nav[section.i18nKeys.create]}
                  title={t.nav[section.i18nKeys.create]}
                  className={cn(
                    "flex h-9 items-center justify-center border-l border-border/60 px-2.5 transition-colors",
                    isActive
                      ? "bg-secondary text-foreground hover:bg-secondary"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <InstallAppButton />
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
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
