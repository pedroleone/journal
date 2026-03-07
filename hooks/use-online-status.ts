"use client";

import { useCallback, useSyncExternalStore } from "react";

function getSnapshot() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function useOnlineStatus() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("online", callback);
    window.addEventListener("offline", callback);

    return () => {
      window.removeEventListener("online", callback);
      window.removeEventListener("offline", callback);
    };
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
