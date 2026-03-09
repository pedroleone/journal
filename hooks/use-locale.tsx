"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { en, locales, type Translations } from "@/lib/i18n";

interface LocaleContextValue {
  locale: string;
  t: Translations;
  setLocale: (locale: string) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  t: en,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Initialized to "en" on both server and client to avoid hydration mismatch.
  // Synced from localStorage in a layout effect (runs before paint, no visible flash).
  const [locale, setLocaleState] = useState("en");
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const stored = localStorage.getItem("locale");
    if (stored && stored in locales && stored !== "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "pt-br" ? "pt-BR" : "en";
  }, [locale]);

  function setLocale(next: string) {
    if (!(next in locales)) return;
    setLocaleState(next);
    localStorage.setItem("locale", next);
  }

  const t = locales[locale] ?? en;

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
