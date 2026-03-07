let cryptoKey: CryptoKey | null = null;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let lockCallback: (() => void) | null = null;

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function setKey(key: CryptoKey) {
  cryptoKey = key;
  resetTimer();
}

export function getKey(): CryptoKey | null {
  return cryptoKey;
}

export function wipeKey() {
  cryptoKey = null;
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
  inactivityTimer = setTimeout(wipeKey, INACTIVITY_TIMEOUT);
}

export function initActivityListeners(): () => void {
  if (typeof window === "undefined") return () => {};

  const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
  const handler = () => {
    if (cryptoKey) resetTimer();
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
