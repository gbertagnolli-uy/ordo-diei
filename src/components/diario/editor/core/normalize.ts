// Portado de vendor/moodiary/editor/src/core/editor/normalize.ts (ZhuJHua/moodiary@2c552dd)
// Solo las constantes que usa el editor. El saneado del documento vive en `@/lib/diario/contenido`,
// que el servidor aplica a todo lo que guarda (no se confía en el cliente).

export type HorizontalRuleVariant = 'solid' | 'dashed' | 'dotted' | 'double' | 'wavy' | 'text'

export const HR_VARIANTS: readonly HorizontalRuleVariant[] = ['solid', 'dashed', 'dotted', 'double', 'wavy', 'text']

export function clampWidthPercent(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(100, Math.max(25, Math.round(value)))
}
