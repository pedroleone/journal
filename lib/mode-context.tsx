"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

export type Mode = "journal" | "food" | "notes";

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function getModeFromPathname(pathname: string): Mode {
  if (pathname.startsWith("/food")) return "food";
  if (pathname.startsWith("/notes")) return "notes";
  return "journal";
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const mode = getModeFromPathname(pathname);

  const setMode = useCallback(
    (newMode: Mode) => {
      if (newMode === mode) return;
      if (newMode === "food") router.push("/food/browse");
      else if (newMode === "notes") router.push("/notes/browse");
      else router.push("/journal/browse");
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
