import { useCallback, useSyncExternalStore } from "react";

export type DefaultView =
  | "journal-browse"
  | "food-browse"
  | "notes-browse"
  | "journal-write"
  | "food-new"
  | "notes-new";

const STORAGE_KEY = "defaultView";
const VALID_VALUES: DefaultView[] = [
  "journal-browse",
  "food-browse",
  "notes-browse",
  "journal-write",
  "food-new",
  "notes-new",
];

export const VIEW_ROUTES: Record<DefaultView, string> = {
  "journal-browse": "/journal/browse",
  "food-browse": "/food/browse",
  "notes-browse": "/notes/browse",
  "journal-write": "/journal/write",
  "food-new": "/food",
  "notes-new": "/notes/browse?new=1",
};

function getSnapshot(): DefaultView {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_VALUES.includes(stored as DefaultView)) {
    return stored as DefaultView;
  }
  return "journal-browse";
}

function getServerSnapshot(): DefaultView {
  return "journal-browse";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useDefaultView() {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setView = useCallback((newView: DefaultView) => {
    localStorage.setItem(STORAGE_KEY, newView);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  return { view, setView };
}
