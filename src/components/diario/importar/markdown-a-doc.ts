// Diario (lane 292): del Markdown de un respaldo al documento Tiptap, con el mismo editor del diario (decisión I2).
// Portado de la idea de vendor/moodiary/.../import/markdown_importer.dart (`MarkdownToTiptap.convert`, ZhuJHua/moodiary@2c552dd): el Markdown se parsea
// con las extensiones del propio editor, no con otro conversor, para que el resultado sea exactamente lo que el editor sabe mostrar.
import { Editor } from "@tiptap/core";
import type { NodoDoc } from "@/lib/diario/contenido";
import { crearExtensiones } from "../editor/core/kit";

let editor: Editor | null = null;

/** Un editor sin pantalla, uno solo para todo el lote. */
function editorSinPantalla(): Editor {
  // Las vistas de los bloques (código, imágenes, audio, video, adjuntos) solo se usan al dibujar; acá nunca se dibuja
  const vistaVacia = (() => null) as never;
  editor ??= new Editor({ extensions: crearExtensiones("", { codeBlock: vistaVacia, image: vistaVacia, audio: vistaVacia, video: vistaVacia, attachment: vistaVacia }), content: "", editable: false, enableContentCheck: false });
  return editor;
}

/** El documento del Markdown, o null si no se pudo armar (el servidor se queda con el texto plano). */
export function markdownADocumento(markdown: string): NodoDoc | null {
  try {
    const bloques = editorSinPantalla().markdown?.parse(markdown)?.content;
    if (!bloques?.length) return null;
    return { type: "doc", content: bloques as NodoDoc[] };
  } catch {
    return null;
  }
}
