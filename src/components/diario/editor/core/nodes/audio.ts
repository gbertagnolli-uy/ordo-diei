// Portado de vendor/moodiary/editor/src/core/editor/nodes/media.ts (ZhuJHua/moodiary@2c552dd): `createMediaNode('audio' | 'video')` y `nameAttribute`.
// Lane 294. En moodiary el `src` es un nombre de archivo local que Flutter traduce a una URL; acá ya es `/api/archivos/<uuid>`.
// Un audio o video pegado desde otra página no entra: solo los archivos propios (`URL_ARCHIVO_DOC`), igual que la imagen.
import { Node, mergeAttributes, type Attribute, type JSONContent } from '@tiptap/core'
import { URL_ARCHIVO_DOC } from '@/lib/diario/contenido'
import { clampWidthPercent } from '../normalize'

export const nameAttribute: Partial<Attribute> = {
  default: null,
  parseHTML: (el) => el.getAttribute('data-name') || null,
  renderHTML: (attrs) => (attrs.name ? { 'data-name': attrs.name } : {}),
}

export const srcAttribute: Partial<Attribute> = {
  default: null,
  parseHTML: (el) => {
    const src = el.getAttribute('data-src')
    return src && URL_ARCHIVO_DOC.test(src) ? src : null
  },
  renderHTML: (attrs) => (attrs.src ? { 'data-src': attrs.src } : {}),
}

const widthPercentAttribute: Partial<Attribute> = {
  default: null,
  parseHTML: (el) => {
    const raw = el.getAttribute('data-width-percent')
    return raw === null ? null : clampWidthPercent(Number(raw))
  },
  renderHTML: (attrs) => (typeof attrs.widthPercent === 'number' ? { 'data-width-percent': String(attrs.widthPercent) } : {}),
}

const escapeLabel = (text: string): string => text.replace(/[\\[\]]/g, (c) => `\\${c}`)

const mediaMarkdown = (node: JSONContent): string => `![${escapeLabel(String(node.attrs?.name ?? ''))}](${String(node.attrs?.src ?? '')})`

function createMediaNode(name: 'audio' | 'video'): Node {
  return Node.create({
    name,
    group: 'block',
    atom: true,
    draggable: false,
    selectable: true,

    addAttributes() {
      return {
        src: srcAttribute,
        name: nameAttribute,
        ...(name === 'video' ? { widthPercent: widthPercentAttribute } : {}),
      }
    },

    parseHTML() {
      return [{ tag: `div[data-media="${name}"]`, getAttrs: (el) => (URL_ARCHIVO_DOC.test((el as HTMLElement).getAttribute('data-src') ?? '') ? null : false) }]
    },

    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes(HTMLAttributes, { 'data-media': name })]
    },

    renderMarkdown: mediaMarkdown,
  })
}

export const AudioNode = createMediaNode('audio')
export const VideoNode = createMediaNode('video')
