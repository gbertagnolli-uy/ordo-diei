// Portado de vendor/moodiary/editor/src/core/editor/kit.ts (ZhuJHua/moodiary@2c552dd)
// Cambios respecto del original: sin el puente con Flutter (`post`, `scheduleChange`, estado, subidas por `saveImage`),
// sin audio, video ni adjuntos (fase 3) y sin el modo panel. La carga del contenido, el guardado y la subida de archivos
// los resuelve el componente React (`EditorTexto`). Lane 290: enlaces entre entradas (`DiaryLink`) y búsqueda en el documento.
import { type AnyExtension, type Editor, type EditorOptions } from '@tiptap/core'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import Underline from '@tiptap/extension-underline'
import { Placeholder } from '@tiptap/extensions'
import { NodeSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common, createLowlight } from 'lowlight'
import { esEnlaceValido } from '@/lib/diario/contenido'
import { leaveSelectedBlock, selectedBlock } from './block'
import { ReglasDeEntrada } from './input-rules'
import { createMarkdownExtension, looksLikeMarkdown } from './markdown'
import { crearDiaryLink, type ContextoEnlace } from './nodes/diary-link'
import { SearchExtension } from './search'
import { ImageNode } from './nodes/image'
import { HorizontalRuleNode } from './nodes/horizontal-rule'
import { TrailingParagraph } from './trailing-paragraph'

type NodeViewComponent = Parameters<typeof ReactNodeViewRenderer>[0]

export interface EditorNodeViews {
  codeBlock: NodeViewComponent
  image: NodeViewComponent
}

const lowlight = createLowlight(common)

const BLOCK = '[data-block-node]'
const BLOCK_CONTROL = 'button, input, a, [role="button"], [role="slider"]'

const LinkHrefOnly = Link.extend({
  inclusive: false,
  addAttributes() {
    return { href: { default: null, parseHTML: (el) => el.getAttribute('href') } }
  },
})

const UnderlineHtml = Underline.extend({
  renderMarkdown: (node, h) => `<u>${h.renderChildren(node)}</u>`,
})

const HIGHLIGHT_START = /(?<![=A-Za-z0-9_])==(?=[^=\s])/
const HIGHLIGHT = /^==([^=\s](?:[^=\n]*[^=\s])?)==(?!=)/

const SingleHighlight = Highlight.extend({
  addAttributes() {
    return { color: { default: null, parseHTML: () => null, rendered: false } }
  },

  // Solo reconoce ==x== pegado al texto; a==b y a===b se dejan tal cual
  markdownTokenizer: {
    name: 'highlight',
    level: 'inline',
    start: (src: string) => src.search(HIGHLIGHT_START),
    tokenize(src, tokens, h) {
      const prev = tokens.at(-1)?.raw?.slice(-1) ?? ''
      if (/[=A-Za-z0-9_]/.test(prev)) return undefined
      const m = HIGHLIGHT.exec(src)
      if (!m) return undefined
      return { type: 'highlight', raw: m[0], text: m[1], tokens: h.inlineTokens(m[1]) }
    },
  },
})

/** `getContexto` dice de qué diario salen las entradas que ofrece `[[`; con `null` la lista no ofrece nada (el enlace igual se muestra). */
export function crearExtensiones(placeholder: string, nodeViews: EditorNodeViews, getContexto: () => ContextoEnlace | null = () => null): AnyExtension[] {
  return [
    StarterKit.configure({
      codeBlock: false,
      horizontalRule: false,
      link: false,
      underline: false,
      trailingNode: false,
    }),
    TrailingParagraph,
    LinkHrefOnly.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      defaultProtocol: 'https',
      // El servidor rechaza cualquier otro esquema: el editor ni siquiera los crea
      isAllowedUri: (url) => esEnlaceValido(url),
      HTMLAttributes: { target: null, rel: null, class: null },
    }),
    UnderlineHtml,
    SingleHighlight,
    CodeBlockLowlight.configure({ lowlight }).extend({
      addNodeView: () => ReactNodeViewRenderer(nodeViews.codeBlock),
    }),
    ImageNode.extend({ addNodeView: () => ReactNodeViewRenderer(nodeViews.image) }),
    HorizontalRuleNode,
    TableKit.configure({ table: { resizable: false } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    crearDiaryLink(getContexto),
    SearchExtension,
    ReglasDeEntrada,
    createMarkdownExtension(),
    Placeholder.configure({ placeholder }),
  ]
}

function blockPosFromDOM(view: EditorView, el: Element): number | null {
  const pos = view.posAtDOM(el, 0)
  for (const candidate of [pos, pos - 1]) {
    if (candidate < 0) continue
    const node = view.state.doc.nodeAt(candidate)
    const dom = node ? view.nodeDOM(candidate) : null
    if (node?.isAtom && node.isBlock && dom instanceof Node && (dom === el || dom.contains(el))) {
      return candidate
    }
  }
  return null
}

// Tocar un bloque solo lo selecciona y no toca el foco: ProseMirror por defecto enfocaría el editor
function selectBlockOnPress(view: EditorView, event: MouseEvent): boolean {
  if (!view.editable || event.button !== 0) return false
  const target = event.target instanceof Element ? event.target : null
  if (!target || target.closest(BLOCK_CONTROL)) return false
  const block = target.closest(BLOCK)
  if (!block) return false
  const pos = blockPosFromDOM(view, block)
  if (pos === null) return false
  event.preventDefault()
  view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)))
  return true
}

interface OpcionesPropiedades {
  getEditor: () => Editor | null
  /** Sube las imágenes y las inserta; devuelve true si manejó los archivos. */
  subirImagenes: (files: File[], pos?: number) => boolean
}

export function crearPropiedades({ getEditor, subirImagenes }: OpcionesPropiedades): Partial<EditorOptions>['editorProps'] {
  const handleBeforeInput = (view: EditorView, event: InputEvent): boolean => {
    const type = event.inputType
    if (type === 'deleteContentBackward' && getEditor()?.commands.undoInputRule()) {
      event.preventDefault()
      return true
    }
    if (!type.startsWith('insert') || !selectedBlock(view.state)) return false
    leaveSelectedBlock(view)
    if (type === 'insertParagraph' || type === 'insertLineBreak') {
      event.preventDefault()
      return true
    }
    // Escribe el texto el propio editor: el navegador insertaría según la selección previa y reemplazaría el DOM del bloque
    if (type === 'insertText' && event.data && event.cancelable) {
      event.preventDefault()
      view.dispatch(view.state.tr.insertText(event.data).scrollIntoView())
      return true
    }
    return false
  }

  const handlePaste = (_view: EditorView, event: ClipboardEvent): boolean => {
    const ed = getEditor()
    const data = event.clipboardData
    if (!ed || !data || !ed.isEditable) return false
    if (data.files.length > 0) return subirImagenes(Array.from(data.files))
    if (data.types.some((t) => t !== 'text/plain')) return false
    const text = data.getData('text/plain')
    // Un Markdown con imágenes se pega como texto: las imágenes de afuera no entran al documento
    if (!text || !looksLikeMarkdown(text) || text.includes('![')) return false
    if (ed.state.selection.$from.parent.type.spec.code) return false
    const blocks = ed.markdown?.parse(text)?.content
    if (!blocks?.length) return false
    // Si el Markdown arma una estructura que no cabe en el esquema, se vuelve al pegado normal
    try {
      ed.commands.insertContent(blocks)
    } catch {
      return false
    }
    return true
  }

  return {
    handleTextInput: (view, _from, _to, text) => {
      if (!leaveSelectedBlock(view)) return false
      view.dispatch(view.state.tr.insertText(text).scrollIntoView())
      return true
    },
    handleKeyDown: (view, event) => event.key === 'Enter' && !event.isComposing && leaveSelectedBlock(view),
    handlePaste,
    handleDrop: (_view, event, _slice, moved) => {
      const ed = getEditor()
      if (moved || !event.dataTransfer?.files.length || !ed?.isEditable) return false
      const pos = ed.view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
      return subirImagenes(Array.from(event.dataTransfer.files), pos)
    },
    handleDOMEvents: {
      mousedown: (view, event) => selectBlockOnPress(view, event),
      // La composición del teclado (IME) no pasa por handleTextInput: se saca la selección del bloque antes
      compositionstart: (view) => {
        leaveSelectedBlock(view)
        return false
      },
      beforeinput: handleBeforeInput,
    },
  }
}
