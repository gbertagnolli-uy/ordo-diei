// Propio de Ordo (lane 174, Q1): reglas puras de los comentarios y reacciones de la familia.
export const EMOJIS = ["👍", "❤️", "🙏"] as const;
export type Emoji = (typeof EMOJIS)[number];
export const MAX_COMENTARIO = 1000;

export const esEmoji = (x: unknown): x is Emoji => typeof x === "string" && (EMOJIS as readonly string[]).includes(x);

/** Texto listo para guardar: sin espacios de más ni saltos de línea repetidos; null si queda vacío o es demasiado largo */
export function limpiarComentario(texto: unknown): string | null {
  if (typeof texto !== "string") return null;
  const t = texto.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return t.length > 0 && t.length <= MAX_COMENTARIO ? t : null;
}

/** «hace 5 min», «ayer», «el 3 de oct» */
export function haceCuanto(iso: string, ahora = Date.now()): string {
  const seg = Math.max(0, Math.round((ahora - Date.parse(iso)) / 1000));
  if (seg < 60) return "recién";
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`;
  if (seg < 172800) return "ayer";
  if (seg < 7 * 86400) return `hace ${Math.floor(seg / 86400)} días`;
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(iso));
}
