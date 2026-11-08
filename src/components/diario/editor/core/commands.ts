// Portado de vendor/moodiary/editor/src/core/editor/commands.ts (ZhuJHua/moodiary@2c552dd)
// Se quitó todo lo que hablaba con Flutter (`post`: abrir enlace, copiar, vista previa de imagen, adjuntos, audio, video).
// Quedan las órdenes de formato que usa la barra, `insertDiaryLink` y la búsqueda dentro del documento (lane 290).
import { type ChainedCommands, type Editor, type JSONContent } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import { esEnlaceValido } from '@/lib/diario/contenido'
import { caretAfterNode, currentTextblockIsEmptyParagraph, insertAtomBlock, insertContainerBlock, selectedBlock } from './block'
import { linkAt } from './link'
import { HR_VARIANTS, clampWidthPercent, type HorizontalRuleVariant } from './normalize'
import { clearSearch, replaceAllMatches, replaceCurrent, searchNext, searchPrev, startSearch } from './search'

export type ExecArgs = Record<string, unknown>

interface RunContext {
  editor: Editor
}

type Handler = (ctx: RunContext, args: ExecArgs) => void

const chain = (ctx: RunContext): ChainedCommands => ctx.editor.chain().focus(undefined, { scrollIntoView: false })

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

const listItemName = (editor: Editor): string | null => {
  const { $from } = editor.state.selection
  for (let d = $from.depth; d > 0; d -= 1) {
    const name = $from.node(d).type.name
    if (name === 'listItem' || name === 'taskItem') return name
  }
  return null
}

function insertAtom(ctx: RunContext, json: JSONContent): void {
  const node = ctx.editor.schema.nodeFromJSON(json)
  chain(ctx)
    .command(({ tr }) => {
      insertAtomBlock(tr, node)
      tr.scrollIntoView()
      return true
    })
    .run()
}

function insertContainer(ctx: RunContext, json: JSONContent, turnInto: (c: ChainedCommands) => ChainedCommands): void {
  if (currentTextblockIsEmptyParagraph(ctx.editor.state)) {
    turnInto(chain(ctx)).run()
    return
  }
  const node: PMNode = ctx.editor.schema.nodeFromJSON(json)
  chain(ctx)
    .command(({ tr }) => {
      insertContainerBlock(tr, node)
      tr.scrollIntoView()
      return true
    })
    .run()
}

/** Agrega `https://` si falta; devuelve '' si el esquema no está permitido. */
export function normalizeHref(raw: string): string {
  const href = raw.trim()
  if (!href) return ''
  if (/^(mailto|tel):/i.test(href)) return href
  // Dos puntos seguidos de dígitos es un puerto (example.com:8080), no un esquema
  const scheme = /^([a-z][a-z0-9+.-]*):(?!\d)/i.exec(href)?.[1]
  if (scheme) return esEnlaceValido(href) ? href : ''
  return `https://${href.replace(/^\/+/, '')}`
}

function setLink(ctx: RunContext, args: ExecArgs): void {
  const href = normalizeHref(str(args.href))
  if (!href) return
  const { editor } = ctx
  const { selection } = editor.state
  const range = selection.empty ? linkAt(editor.state) : { from: selection.from, to: selection.to }
  const text = str(args.text) || (range ? editor.state.doc.textBetween(range.from, range.to, ' ') : '') || href
  const from = range?.from ?? selection.from
  const to = range?.to ?? selection.to
  chain(ctx)
    .command(({ tr }) => {
      const type = editor.schema.marks.link
      const link = type.create({ href })
      if (from < to && tr.doc.textBetween(from, to, ' ') === text) {
        tr.removeMark(from, to, type).addMark(from, to, link)
      } else {
        const marks = tr.doc.resolve(from).marks().filter((m) => m.type !== type)
        tr.replaceWith(from, to, editor.schema.text(text, [...marks, link]))
      }
      tr.setSelection(TextSelection.create(tr.doc, from + text.length))
      tr.removeStoredMark(type)
      return true
    })
    .run()
}

const SIZED_TYPES = new Set(['image'])

function sizedNode(editor: Editor): NodeSelection | null {
  const sel = editor.state.selection
  return sel instanceof NodeSelection && SIZED_TYPES.has(sel.node.type.name) ? sel : null
}

const HANDLERS: Record<string, Handler> = {
  toggleBold: (c) => void chain(c).toggleBold().run(),
  toggleItalic: (c) => void chain(c).toggleItalic().run(),
  toggleUnderline: (c) => void chain(c).toggleUnderline().run(),
  toggleStrike: (c) => void chain(c).toggleStrike().run(),
  toggleCode: (c) => void chain(c).toggleCode().run(),
  toggleHighlight: (c) => void chain(c).toggleHighlight().run(),
  clearFormatting: (c) => void chain(c).unsetAllMarks().clearNodes().run(),
  setParagraph: (c) => void chain(c).setParagraph().run(),
  setHeading: (c, a) => {
    const level = Number(a.level)
    if (level >= 1 && level <= 6) chain(c).toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
  },
  toggleBlockquote: (c) => void chain(c).toggleBlockquote().run(),
  toggleCodeBlock: (c) => void chain(c).toggleCodeBlock().run(),
  toggleBulletList: (c) => void chain(c).toggleBulletList().run(),
  toggleOrderedList: (c) => void chain(c).toggleOrderedList().run(),
  toggleTaskList: (c) => void chain(c).toggleTaskList().run(),
  indent: (c) => {
    const item = listItemName(c.editor)
    if (item) chain(c).sinkListItem(item).run()
  },
  outdent: (c) => {
    const item = listItemName(c.editor)
    if (item) chain(c).liftListItem(item).run()
  },
  undo: (c) => void chain(c).undo().run(),
  redo: (c) => void chain(c).redo().run(),
  insertImage: (c, a) => {
    if (str(a.src)) insertAtom(c, { type: 'image', attrs: { src: str(a.src), name: str(a.name).trim() || null } })
  },
  insertTable: (c) => void chain(c).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  insertHorizontalRule: (c, a) => {
    const variant = HR_VARIANTS.includes(a.variant as HorizontalRuleVariant) ? a.variant : 'solid'
    insertAtom(c, { type: 'horizontalRule', attrs: { variant, label: null } })
  },
  insertBlockquote: (c) =>
    insertContainer(c, { type: 'blockquote', content: [{ type: 'paragraph' }] }, (ch) => ch.toggleBlockquote()),
  insertCodeBlock: (c) => insertContainer(c, { type: 'codeBlock' }, (ch) => ch.setCodeBlock()),
  insertTaskList: (c) =>
    insertContainer(
      c,
      { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] }] },
      (ch) => ch.toggleTaskList(),
    ),
  setLink,
  unsetLink: (c) => {
    const link = linkAt(c.editor.state)
    if (link) chain(c).setTextSelection({ from: link.from, to: link.to }).unsetLink().run()
  },
  setMediaWidth: (c, a) => {
    const sel = sizedNode(c.editor)
    const reset = a.percent === null
    const percent = reset ? null : clampWidthPercent(Number(a.percent))
    if (!sel || (!reset && percent === null)) return
    chain(c).updateAttributes(sel.node.type.name, { widthPercent: percent }).run()
  },
  deleteBlock: (c) => {
    if (c.editor.state.selection instanceof NodeSelection) chain(c).deleteSelection().run()
  },
  tableAddRowAfter: (c) => void chain(c).addRowAfter().run(),
  tableDeleteRow: (c) => void chain(c).deleteRow().run(),
  tableAddColumnAfter: (c) => void chain(c).addColumnAfter().run(),
  tableDeleteColumn: (c) => void chain(c).deleteColumn().run(),
  tableToggleHeaderRow: (c) => void chain(c).toggleHeaderRow().run(),
  tableDelete: (c) => void chain(c).deleteTable().run(),
  insertDiaryLink: (c) => void chain(c).insertContent('[[').run(),
  search: (c, a) => startSearch(c.editor, str(a.query), a.caseSensitive === true),
  searchNext: (c) => searchNext(c.editor),
  searchPrev: (c) => searchPrev(c.editor),
  replace: (c, a) => {
    if (c.editor.isEditable) replaceCurrent(c.editor, str(a.text))
  },
  replaceAll: (c, a) => {
    if (c.editor.isEditable) replaceAllMatches(c.editor, str(a.text))
  },
  clearSearch: (c) => clearSearch(c.editor),
}

// Con un bloque seleccionado hay que pasar el cursor después del bloque, si no el bloque se reemplaza
const LEAVE_BLOCK_FIRST = new Set(['insertTable', 'insertDiaryLink', 'setLink'])

export function execCommand(editor: Editor, command: string, args: ExecArgs = {}): boolean {
  const handler = Object.prototype.hasOwnProperty.call(HANDLERS, command) ? HANDLERS[command] : undefined
  if (!handler) return false
  if (!editor.isEditable) return true
  if (LEAVE_BLOCK_FIRST.has(command) && selectedBlock(editor.state)) {
    const tr = editor.state.tr
    caretAfterNode(tr)
    editor.view.dispatch(tr)
  }
  handler({ editor }, args)
  return true
}
