// Contenido enriquecido del diario (lane 283). Reglas puras: sin base, sin red, sin ProseMirror.
// El texto plano se deriva con el mismo contrato que Portado de vendor/moodiary/editor/src/core/editor/plain-text.ts
// (ZhuJHua/moodiary@2c552dd): los bloques de texto se separan con «\n» como `textBetween(0, size, '\n')`.
// El servidor no confía en el cliente: `sanearDocumento` reconstruye el documento solo con nodos, marcas y
// atributos conocidos, así que un JSON armado a mano no puede meter HTML, enlaces `javascript:` ni imágenes ajenas.

export interface NodoDoc {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NodoDoc[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

export const VERSION_DOC = 2;
export const MAX_BYTES_DOC = 300_000;
export const MAX_NODOS_DOC = 6_000;
export const MAX_PROFUNDIDAD_DOC = 24;
export const URL_ARCHIVO_DOC = /^\/api\/archivos\/[0-9a-f-]{36}$/i;

const DOC_VACIO: NodoDoc = { type: "doc", attrs: { v: VERSION_DOC }, content: [{ type: "paragraph" }] };
const VARIANTES_REGLA = ["solid", "dashed", "dotted", "double", "wavy", "text"];
const ESQUEMAS_ENLACE = /^(https?:\/\/|mailto:|tel:)/i;

/** ¿El enlace usa un esquema permitido? (el editor y el servidor aplican la misma regla). */
export const esEnlaceValido = (href: string) => ESQUEMAS_ENLACE.test(href.trim());

type Atributos = Record<string, unknown>;
type Limpiar = (attrs: Atributos) => Atributos;

const entero = (v: unknown, min: number, max: number, def: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : def;
const textoCorto = (v: unknown, max: number) => (typeof v === "string" && v.length <= max ? v : null);

/** Id de una entrada enlazada: solo dígitos, sin ceros a la izquierda, hasta 12. */
export const ID_ENLACE = /^[1-9]\d{0,11}$/;

/** Atributos permitidos por tipo de nodo. Un tipo que no está acá no se admite. */
const NODOS: Record<string, Limpiar | null> = {
  doc: () => ({ v: VERSION_DOC }),
  paragraph: null,
  text: null,
  hardBreak: null,
  blockquote: null,
  bulletList: null,
  listItem: null,
  taskList: null,
  table: null,
  tableRow: null,
  heading: (a) => ({ level: entero(a.level, 1, 6, 1) }),
  orderedList: (a) => ({ start: entero(a.start, 1, 100_000, 1) }),
  taskItem: (a) => ({ checked: a.checked === true }),
  codeBlock: (a) => {
    const lang = textoCorto(a.language, 30);
    return { language: lang && /^[a-z0-9+#._-]+$/i.test(lang) ? lang : null };
  },
  tableCell: (a) => ({ colspan: entero(a.colspan, 1, 20, 1), rowspan: entero(a.rowspan, 1, 20, 1) }),
  tableHeader: (a) => ({ colspan: entero(a.colspan, 1, 20, 1), rowspan: entero(a.rowspan, 1, 20, 1) }),
  horizontalRule: (a) => ({
    variant: VARIANTES_REGLA.includes(String(a.variant)) ? a.variant : "solid",
    label: textoCorto(a.label, 100),
  }),
  image: (a) => {
    if (typeof a.src !== "string" || !URL_ARCHIVO_DOC.test(a.src)) throw new Error("Imagen inválida");
    const w = typeof a.widthPercent === "number" && Number.isFinite(a.widthPercent) ? Math.min(100, Math.max(25, Math.round(a.widthPercent))) : null;
    return { src: a.src, name: textoCorto(a.name, 200), widthPercent: w };
  },
  // Lane 290 (moodiary `diaryLink`): enlace a otra entrada. El id es el de la entrada; el rótulo es lo que se ve.
  diaryLink: (a) => {
    const id = typeof a.id === "number" ? String(a.id) : a.id;
    if (typeof id !== "string" || !ID_ENLACE.test(id)) throw new Error("Enlace a entrada inválido");
    return { id, label: textoCorto(a.label, 200) ?? "" };
  },
};

const MARCAS: Record<string, Limpiar | null> = {
  bold: null,
  italic: null,
  underline: null,
  strike: null,
  code: null,
  highlight: null,
  link: (a) => {
    const href = typeof a.href === "string" ? a.href.trim() : "";
    if (!href || href.length > 2000 || !esEnlaceValido(href)) throw new Error("Enlace inválido");
    return { href };
  },
};

/** Valida y reconstruye un documento. Lanza `Error` con un mensaje para el usuario si no es válido. */
export function sanearDocumento(entrada: unknown): NodoDoc {
  if (!entrada || typeof entrada !== "object") throw new Error("Contenido inválido");
  if (JSON.stringify(entrada).length > MAX_BYTES_DOC) throw new Error("La entrada es demasiado larga");
  let nodos = 0;

  const limpiar = (n: unknown, prof: number): NodoDoc => {
    if (!n || typeof n !== "object" || Array.isArray(n)) throw new Error("Contenido inválido");
    if (prof > MAX_PROFUNDIDAD_DOC) throw new Error("Contenido demasiado anidado");
    if (++nodos > MAX_NODOS_DOC) throw new Error("La entrada es demasiado larga");
    const { type, attrs, content, marks, text } = n as NodoDoc;
    if (typeof type !== "string" || !Object.prototype.hasOwnProperty.call(NODOS, type)) throw new Error("Contenido inválido");
    const salida: NodoDoc = { type };
    const f = NODOS[type];
    if (f) salida.attrs = f(attrs && typeof attrs === "object" ? attrs : {});
    if (type === "text") {
      if (typeof text !== "string") throw new Error("Contenido inválido");
      salida.text = text;
    }
    if (Array.isArray(marks) && marks.length) {
      const limpias = marks.map((m) => {
        if (!m || typeof m.type !== "string" || !Object.prototype.hasOwnProperty.call(MARCAS, m.type)) throw new Error("Contenido inválido");
        const g = MARCAS[m.type];
        return g ? { type: m.type, attrs: g(m.attrs && typeof m.attrs === "object" ? m.attrs : {}) } : { type: m.type };
      });
      // En el editor `code` excluye a las demás marcas: un documento con `code` y otra a la vez no se podría abrir
      salida.marks = limpias.some((m) => m.type === "code") ? [{ type: "code" }] : limpias;
    }
    if (Array.isArray(content) && content.length) salida.content = content.map((c) => limpiar(c, prof + 1));
    return salida;
  };

  const doc = limpiar(entrada, 0);
  if (doc.type !== "doc") throw new Error("Contenido inválido");
  if (!doc.content?.length) return structuredClone(DOC_VACIO);
  return doc;
}

const esBloqueDeTexto = (t: string) => t === "paragraph" || t === "heading" || t === "codeBlock";

/** Texto plano del documento: un bloque de texto por línea. Las imágenes y reglas no aportan texto. */
export function textoPlanoDe(doc: NodoDoc): string {
  let texto = "";
  let primero = true;
  const recorrer = (n: NodoDoc) => {
    if (n.type === "text") {
      texto += n.text ?? "";
      return;
    }
    if (n.type === "hardBreak") {
      texto += "\n";
      return;
    }
    // moodiary `plain-text.ts`: un enlace a otra entrada aporta su rótulo
    if (n.type === "diaryLink") {
      texto += String(n.attrs?.label ?? "").replace(/\s+/g, " ").trim();
      return;
    }
    if (esBloqueDeTexto(n.type)) {
      if (primero) primero = false;
      else texto += "\n";
    }
    for (const c of n.content ?? []) recorrer(c);
  };
  recorrer(doc);
  return texto;
}

/** Entrada escrita en texto plano (lane 272) -> documento: un párrafo por línea. */
export function docDesdeTexto(texto: string): NodoDoc {
  const lineas = texto.split(/\r?\n/);
  return {
    type: "doc",
    attrs: { v: VERSION_DOC },
    content: lineas.map((l) => (l ? { type: "paragraph", content: [{ type: "text", text: l }] } : { type: "paragraph" })),
  };
}

/** ¿El documento lleva alguna imagen? (una entrada puede ser solo una foto). */
export function tieneImagen(doc: NodoDoc): boolean {
  return doc.type === "image" || (doc.content ?? []).some(tieneImagen);
}

/** Las URLs `/api/archivos/<uuid>` de las imágenes del documento, en orden. */
export function imagenesDe(doc: NodoDoc): string[] {
  const urls: string[] = [];
  const recorrer = (n: NodoDoc) => {
    if (n.type === "image" && typeof n.attrs?.src === "string") urls.push(n.attrs.src);
    n.content?.forEach(recorrer);
  };
  recorrer(doc);
  return urls;
}
