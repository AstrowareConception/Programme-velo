"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let interval: number | undefined;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.update().catch(() => undefined);
      interval = window.setInterval(() => registration.update().catch(() => undefined), 60 * 60 * 1000);
    }).catch(() => undefined);

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return null;
}
