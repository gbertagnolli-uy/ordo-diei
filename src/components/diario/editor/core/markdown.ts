// Portado de vendor/moodiary/editor/src/core/editor/markdown.ts (ZhuJHua/moodiary@2c552dd)
import { Markdown } from '@tiptap/markdown'
import { Marked } from 'marked'
import markedCjkFriendly from 'marked-cjk-friendly'

// Una instancia de marked por editor: @tiptap/markdown le registra tokenizers y, compartida, se irían acumulando
export function createMarkdownExtension() {
  const marked = new Marked(markedCjkFriendly())
  return Markdown.configure({
    marked: marked as unknown as NonNullable<Parameters<typeof Markdown.configure>[0]>['marked'],
    markedOptions: { gfm: true, breaks: true },
  })
}

const BLOCK_MARKERS = [
  /^#{1,6}\s+\S/,
  /^\s{0,3}(?:[-*+]|\d+[.)])\s+\S/,
  /^\s{0,3}[-*+]\s+\[[ xX]\]\s/,
  /^\s{0,3}>\s?\S/,
  /^\s{0,3}(?:```|~~~)/,
  /^\s*\|.*\|\s*$/,
]

export function looksLikeMarkdown(text: string): boolean {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (lines.filter((l) => l.trim()).length < 2) return false
  return lines.some((line) => BLOCK_MARKERS.some((re) => re.test(line)))
}
