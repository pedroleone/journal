"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

export type Mode = "journal" | "food";

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function getModeFromPathname(pathname: string): Mode {
  return pathname.startsWith("/food") ? "food" : "journal";
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const mode = getModeFromPathname(pathname);

  const setMode = useCallback(
    (newMode: Mode) => {
      if (newMode === mode) return;
      router.push(newMode === "food" ? "/food/browse" : "/journal/browse");
    },
    [mode, router],
  );

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
