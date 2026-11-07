"use client";
// Adaptado de vendor/dovli/apps/web/src/lib/settings.ts (MayankJha0333/dovli@eb453e0)
// Lane 271 (D9): solo las preferencias que usan las pantallas de notas (barra lateral oculta y corrector).
// No escribe nada en <html>: el tema, el tamaño de letra y el modo oscuro son los de Ordo.
import { useSyncExternalStore } from "react";

export const SETTINGS_KEY = "ordo.notas.settings.v1";

export interface Settings {
  /** Ocultar la barra lateral de las notas en pantallas anchas (⌘\\). En pantallas chicas es un cajón igual. */
  sidebarHidden: boolean;
  spellcheck: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sidebarHidden: false,
  spellcheck: true,
};

function read(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return {
      sidebarHidden: raw.sidebarHidden === true,
      spellcheck: raw.spellcheck !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let state: Settings = typeof window === "undefined" ? DEFAULT_SETTINGS : read();
const listeners = new Set<() => void>();

export const settings = {
  get: () => state,
  set(patch: Partial<Settings>) {
    state = { ...state, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
    } catch {
      /* ventana privada: vale solo para esta visita */
    }
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

if (typeof window !== "undefined") {
  // Otra pestaña cambió una preferencia.
  window.addEventListener("storage", (e) => {
    if (e.key === SETTINGS_KEY) {
      state = read();
      listeners.forEach((l) => l());
    }
  });
}

export function useSettings<T>(select: (s: Settings) => T): T {
  return useSyncExternalStore(settings.subscribe, () => select(state), () => select(DEFAULT_SETTINGS));
}
