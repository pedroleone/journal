"use client";

import { useEffect, useState, useCallback } from "react";
import { getKey, wipeKey } from "@/lib/key-manager";

const GRACE_PERIOD = 2000;

export function useVisibilityLock() {
  const [isLocked, setIsLocked] = useState(false);

  const checkLocked = useCallback(() => {
    setIsLocked(getKey() === null);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const handler = () => {
      if (document.visibilityState === "hidden") {
        timer = setTimeout(() => {
          wipeKey();
          setIsLocked(true);
        }, GRACE_PERIOD);
      } else {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        checkLocked();
      }
    };

    document.addEventListener("visibilitychange", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
      if (timer) clearTimeout(timer);
    };
  }, [checkLocked]);

  return { isLocked, setIsLocked, checkLocked };
}
