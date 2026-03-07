const DEFAULT_UNLOCK_REDIRECT = "/browse";

export function normalizeUnlockNext(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return DEFAULT_UNLOCK_REDIRECT;
  }

  if (
    nextPath.startsWith("/unlock") ||
    nextPath.startsWith("/login") ||
    nextPath.startsWith("/api/auth")
  ) {
    return DEFAULT_UNLOCK_REDIRECT;
  }

  return nextPath;
}

export function buildUnlockHref(nextPath: string) {
  const normalized = normalizeUnlockNext(nextPath);
  return `/unlock?next=${encodeURIComponent(normalized)}`;
}
