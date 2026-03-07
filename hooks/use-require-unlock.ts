"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildUnlockHref } from "@/lib/unlock";
import { getKey, initActivityListeners, onLock } from "@/lib/key-manager";

export function useRequireUnlock() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasKey, setHasKey] = useState(() => !!getKey());

  const nextPath = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;

  useEffect(() => {
    const redirectToUnlock = () => {
      setHasKey(false);
      router.replace(buildUnlockHref(nextPath));
    };

    const cleanupActivityListeners = initActivityListeners();
    const cleanupLock = onLock(redirectToUnlock);

    if (!getKey()) {
      redirectToUnlock();
    }

    return () => {
      cleanupActivityListeners();
      cleanupLock();
    };
  }, [nextPath, router]);

  return hasKey;
}
