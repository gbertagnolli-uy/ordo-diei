// Portado de vendor/moodiary/editor/src/core/editor/link.ts (ZhuJHua/moodiary@2c552dd)
import { getMarkRange } from '@tiptap/core'
import type { EditorState } from '@tiptap/pm/state'

interface LinkAt {
  href: string
  from: number
  to: number
}

// Un cursor pegado a cualquiera de los extremos del enlace cuenta como dentro del enlace (en iOS el toque deja el cursor justo al final de la palabra)
export function linkAt(state: EditorState): LinkAt | null {
  const type = state.schema.marks.link
  const { selection } = state
  const range = getMarkRange(selection.$from, type)
  if (!range || selection.from < range.from || selection.to > range.to) return null
  const mark = state.doc
    .nodeAt(range.from)
    ?.marks.find((m) => m.type === type)
  return mark ? { href: String(mark.attrs.href ?? ''), from: range.from, to: range.to } : null
}
