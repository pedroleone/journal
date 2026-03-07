import type { EntrySource } from "@/lib/types";

let userKey: CryptoKey | null = null;
let serverKey: CryptoKey | null = null;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let lockCallback: (() => void) | null = null;

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function setUserKey(key: CryptoKey) {
  userKey = key;
  resetTimer();
}

export function getUserKey(): CryptoKey | null {
  return userKey;
}

export function setServerKey(key: CryptoKey) {
  serverKey = key;
  resetTimer();
}

export function getServerKey(): CryptoKey | null {
  return serverKey;
}

export function getKeyForSource(source: EntrySource): CryptoKey | null {
  return source === "telegram" ? serverKey : userKey;
}

export function hasUnlockedKeys() {
  return userKey !== null && serverKey !== null;
}

export function wipeKeys() {
  userKey = null;
  serverKey = null;
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  lockCallback?.();
}

export function onLock(cb: () => void) {
  lockCallback = cb;
  return () => {
    if (lockCallback === cb) {
      lockCallback = null;
    }
  };
}

function resetTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(wipeKeys, INACTIVITY_TIMEOUT);
}

export function initActivityListeners(): () => void {
  if (typeof window === "undefined") return () => {};

  const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
  const handler = () => {
    if (userKey || serverKey) resetTimer();
  };

  for (const event of events) {
    document.addEventListener(event, handler, { passive: true });
  }

  return () => {
    for (const event of events) {
      document.removeEventListener(event, handler);
    }
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  };
}
