// Propio de Ordo: el Stepper toma los tokens de la app (igual que TaskForm.tsx, que no los exporta).
import type { CSSProperties } from "react";

const tinta = (pct: number) => `color-mix(in srgb, var(--foreground) ${pct}%, transparent)`;

export const STEPPER_VARS = {
  "--stepper-ink": "var(--foreground)",
  "--stepper-muted": tinta(60),
  "--stepper-faint": tinta(25),
  "--stepper-ring": tinta(30),
  "--stepper-well": "var(--muted)",
  "--stepper-track": tinta(12),
  "--stepper-tile": "var(--card)",
  "--stepper-tile-edge": "var(--border)",
  "--stepper-tile-highlight": "transparent",
  "--stepper-tile-shadow": `0 1px 3px ${tinta(22)}`,
  "--stepper-solid": "var(--primary)",
  "--stepper-solid-ink": "var(--primary-foreground)",
  "--stepper-hover": "brightness(0.95)",
  "--stepper-hover-fill": tinta(5),
  "--stepper-solid-hover": "brightness(0.9)",
  "--stepper-press": "brightness(0.85)",
} as CSSProperties;
