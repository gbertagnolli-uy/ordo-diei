// Portado de vendor/moodiary/editor/src/core/editor/nodes/media.ts (ZhuJHua/moodiary@2c552dd)
// Solo la imagen. En moodiary el `src` es un nombre de archivo local que Flutter traduce a una URL (puente `resolveMedia`);
// acá el `src` ya es la URL `/api/archivos/<uuid>` que devuelve /api/upload, así que no hay traducción.
import { Node, mergeAttributes, type Attribute, type JSONContent } from '@tiptap/core'
import { URL_ARCHIVO_DOC } from '@/lib/diario/contenido'
import { clampWidthPercent } from '../normalize'

const widthPercentAttribute: Partial<Attribute> = {
  default: null,
  parseHTML: (el) => {
    const raw = el.getAttribute('data-width-percent')
    return raw === null ? null : clampWidthPercent(Number(raw))
  },
  renderHTML: (attrs) => {
    const v = attrs.widthPercent
    return typeof v === 'number' ? { 'data-width-percent': String(v) } : {}
  },
}

const escapeLabel = (text: string): string => text.replace(/[\\[\]]/g, (c) => `\\${c}`)

export const ImageNode = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      name: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-name') || el.getAttribute('alt') || null,
        renderHTML: (attrs) => (attrs.name ? { 'data-name': attrs.name, alt: attrs.name } : {}),
      },
      widthPercent: widthPercentAttribute,
    }
  },

  // Solo imágenes propias: una imagen pegada desde otra página (HTML externo) no entra al documento
  parseHTML() {
    return [{ tag: 'img[src]', getAttrs: (el) => (URL_ARCHIVO_DOC.test(el.getAttribute('src') ?? '') ? null : false) }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },

  markdownTokenName: 'image',

  parseMarkdown: (token, helpers) =>
    helpers.createNode('image', { src: String(token.href ?? ''), name: String(token.text ?? '') || token.title || null }),

  renderMarkdown: (node: JSONContent) => `![${escapeLabel(String(node.attrs?.name ?? ''))}](${String(node.attrs?.src ?? '')})`,
})
