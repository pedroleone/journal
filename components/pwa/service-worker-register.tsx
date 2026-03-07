"use client";

import { useEffect } from "react";

const SERVICE_WORKER_URL = "/sw.js";

export async function registerServiceWorker() {
  if (
    process.env.NODE_ENV !== "production" ||
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return null;
  }

  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  return navigator.serviceWorker.register(SERVICE_WORKER_URL);
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return null;
}
