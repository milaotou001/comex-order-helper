"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").then(
      () => console.log("SW registered"),
      (err) => console.log("SW failed:", err)
    );
  }, []);

  return null;
}
