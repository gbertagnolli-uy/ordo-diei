// Portado de vendor/moodiary/editor/src/core/editor/input-rules.ts (ZhuJHua/moodiary@2c552dd)
// Se quitaron las reglas de caracteres de ancho completo (teclados chinos), que no aplican a esta app.
import { Extension, markInputRule, type InputRule, type InputRuleFinder } from '@tiptap/core'

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// No exige espacio antes (hoy **muy feliz**), pero no se dispara si el carácter previo es alfanumérico ASCII (2*3*)
export function relaxedDelimiter(delim: string): InputRuleFinder {
  const ch = delim[0]
  const pattern = new RegExp(`${escapeRe(delim)}([^${escapeRe(ch)}\n]+?)${escapeRe(delim)}$`)
  return (text) => {
    const m = pattern.exec(text)
    if (!m || m.index === undefined) return null
    const inner = m[1]
    if (/^\s|\s$/.test(inner)) return null
    const before = text.charAt(m.index - 1)
    if (before && (before === ch || /[A-Za-z0-9_]/.test(before))) return null
    return { index: m.index, text: m[0], replaceWith: inner }
  }
}

export const ReglasDeEntrada = Extension.create({
  name: 'reglasDeEntrada',

  addInputRules() {
    const { marks } = this.editor.schema
    const rules: InputRule[] = []
    const relaxed: Array<[string, string]> = [
      ['**', 'bold'],
      ['~~', 'strike'],
      ['==', 'highlight'],
      ['*', 'italic'],
    ]
    for (const [delim, name] of relaxed) {
      const type = marks[name]
      if (type) rules.push(markInputRule({ find: relaxedDelimiter(delim), type }))
    }
    return rules
  },
})
