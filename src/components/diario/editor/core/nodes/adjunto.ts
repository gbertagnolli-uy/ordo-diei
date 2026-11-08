// Portado de vendor/moodiary/editor/src/core/editor/nodes/attachment.ts (ZhuJHua/moodiary@2c552dd)
// Lane 294. Sin el tokenizador de Markdown con enlaces `file-…` (los pega Flutter): el Markdown del diario no trae adjuntos.
// El `src` es `/api/archivos/<uuid>`; solo los archivos propios entran al documento.
import { Node, mergeAttributes, type JSONContent } from '@tiptap/core'
import { URL_ARCHIVO_DOC } from '@/lib/diario/contenido'
import { nameAttribute, srcAttribute } from './audio'

const escapeLabel = (text: string): string => text.replace(/[\\[\]]/g, (c) => `\\${c}`)

export const AttachmentNode = Node.create({
  name: 'attachment',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      src: srcAttribute,
      name: nameAttribute,
      mime: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-mime'),
        renderHTML: (attrs) => (attrs.mime ? { 'data-mime': attrs.mime } : {}),
      },
      size: {
        default: null,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-size')?.trim()
          if (!raw) return null
          const n = Number(raw)
          return Number.isFinite(n) && n >= 0 ? n : null
        },
        renderHTML: (attrs) => (typeof attrs.size === 'number' ? { 'data-size': String(attrs.size) } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="attachment"]', getAttrs: (el) => (URL_ARCHIVO_DOC.test((el as HTMLElement).getAttribute('data-src') ?? '') ? null : false) }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'attachment' }), String(node.attrs.name ?? node.attrs.src ?? '')]
  },

  renderMarkdown: (node: JSONContent) => `[${escapeLabel(String(node.attrs?.name ?? ''))}](${String(node.attrs?.src ?? '')})`,
})
