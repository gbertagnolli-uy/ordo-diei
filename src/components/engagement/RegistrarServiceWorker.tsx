"use client";

// Registra el service worker (lane 204): hace la app instalable y permite recibir avisos. No guarda nada en caché.
import { useEffect } from "react";

export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
