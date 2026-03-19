"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { NAV_SECTIONS, useCreateHandlers } from "@/components/nav/nav-sections";
import { useLocale } from "@/hooks/use-locale";
import { useMode, type Mode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";

const CREATE_HANDLER_BY_MODE: Record<Mode, keyof ReturnType<typeof useCreateHandlers>> = {
  journal: "createJournal",
  food: "createFood",
  notes: "createNote",
  library: "createLibrary",
};

export function MobileBottomBar() {
  const router = useRouter();
  const { mode } = useMode();
  const { t } = useLocale();
  const createHandlers = useCreateHandlers();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const wasOpenRef = useRef(false);
  const titleId = useId();

  const primarySections = NAV_SECTIONS.slice(0, 2);
  const secondarySections = NAV_SECTIONS.slice(2);

  useEffect(() => {
    if (isSheetOpen) {
      optionRefs.current[0]?.focus();
    } else if (wasOpenRef.current) {
      fabRef.current?.focus();
    }

    wasOpenRef.current = isSheetOpen;
  }, [isSheetOpen]);

  useEffect(() => {
    if (!isSheetOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsSheetOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusableOptions = optionRefs.current.filter(
        (option): option is HTMLButtonElement => option !== null,
      );

      if (focusableOptions.length === 0) return;

      const firstOption = focusableOptions[0];
      const lastOption = focusableOptions[focusableOptions.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstOption || !focusableOptions.includes(activeElement as HTMLButtonElement)) {
          event.preventDefault();
          lastOption.focus();
        }
        return;
      }

      if (activeElement === lastOption) {
        event.preventDefault();
        firstOption.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSheetOpen]);

  async function handleCreate(modeKey: Mode) {
    setIsSheetOpen(false);
    await createHandlers[CREATE_HANDLER_BY_MODE[modeKey]]();
  }

  function renderNavButton(section: (typeof NAV_SECTIONS)[number]) {
    const Icon = section.icon;
    const isActive = mode === section.key;

    return (
      <button
        key={section.key}
        type="button"
        onClick={() => router.push(section.browseRoute)}
        aria-label={t.nav[section.i18nKeys.browse]}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-center transition-colors",
          isActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="text-[11px] leading-none">{t.nav[section.i18nKeys.label]}</span>
      </button>
    );
  }

  return (
    <>
      {isSheetOpen ? (
        <div className="fixed inset-0 z-[60]">
          <div
            aria-hidden="true"
            className="animate-create-sheet-backdrop fixed inset-0 bg-black/40"
            onClick={() => setIsSheetOpen(false)}
          />
          <div
            id="create-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="animate-create-sheet-panel safe-bottom fixed inset-x-0 bottom-0 rounded-t-2xl border-t border-border/60 bg-background px-4 pb-6 pt-4 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border/80" />
            <h2 id={titleId} className="mb-3 font-display text-xl tracking-tight">
              {t.nav.createNew}
            </h2>
            <div className="space-y-2">
              {NAV_SECTIONS.map((section, index) => {
                const Icon = section.icon;

                return (
                  <button
                    key={section.key}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    onClick={() => void handleCreate(section.key)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-4 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {t.nav[section.i18nKeys.create]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Main navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur"
      >
        <div className="relative px-3 pb-3 pt-2">
          <button
            ref={fabRef}
            type="button"
            onClick={() => setIsSheetOpen((open) => !open)}
            aria-label={t.nav.createNew}
            aria-controls="create-sheet"
            aria-expanded={isSheetOpen}
            className="absolute -top-7 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-shadow hover:shadow-xl"
          >
            <Plus
              className={cn(
                "h-5 w-5 transition-transform motion-safe:duration-200",
                isSheetOpen && "rotate-45",
              )}
            />
          </button>

          <div className="flex items-start gap-3">
            <div className="grid flex-1 grid-cols-2">{primarySections.map(renderNavButton)}</div>
            <div aria-hidden="true" className="w-14 shrink-0" />
            <div className="grid flex-1 grid-cols-2">{secondarySections.map(renderNavButton)}</div>
          </div>
        </div>
      </nav>
    </>
  );
}
