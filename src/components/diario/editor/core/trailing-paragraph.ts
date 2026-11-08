// Portado de vendor/moodiary/editor/src/core/editor/trailing-paragraph.ts (ZhuJHua/moodiary@2c552dd)
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const TrailingParagraph = Extension.create({
  name: 'trailingParagraph',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('trailingParagraph'),
        appendTransaction: (transactions, _old, state) => {
          if (!transactions.some((tr) => tr.docChanged)) return null
          // No se agrega en la transacción de una regla de entrada: si no, Retroceso no podría deshacer la conversión
          if (transactions.some((tr) => tr.getMeta('inputRule'))) return null
          const last = state.doc.lastChild
          if (!last || last.type.name === 'paragraph') return null
          return state.tr.insert(state.doc.content.size, state.schema.nodes.paragraph.create())
        },
      }),
    ]
  },
})
