// Premios de la bitácora de comportamiento (vault/LANE_80_PANEL_ADMIN_COMPORTAMIENTO.md).
// Módulo puro: lo usan el servidor (validar/aplicar) y el cliente (formulario y textos).

export type ItemPremio =
  | { tipo: "puntos"; cantidad: number }
  | { tipo: "incienso"; cantidad: number }
  | { tipo: "xp"; cantidad: number }
  | { tipo: "carta"; cartaId: number; nombre: string; modo: "completa" | "fragmentos"; cantidad?: number }
  | { tipo: "vale"; texto: string } // voucher canjeable: «Vale por {texto}» (lane 86)
  | { tipo: "exoneracion"; texto: string }
  | { tipo: "extra"; texto: string };

export const MAX_CANTIDAD = 100_000;
export const MAX_FRAGMENTOS = 500;
export const MAX_TEXTO = 200;
export const MAX_ITEMS = 10;

/** Los que la app entrega sola al abrir el premio; el resto lo cumple un padre en persona */
export const esAutomatico = (i: ItemPremio) => i.tipo !== "exoneracion" && i.tipo !== "extra";

const entero = (v: unknown, max: number, nombre: string) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > max) throw new Error(`${nombre}: indicá un número entero entre 1 y ${max}`);
  return n;
};

const texto = (v: unknown, nombre: string) => {
  const t = typeof v === "string" ? v.trim() : "";
  if (!t) throw new Error(`${nombre}: escribí de qué se trata`);
  if (t.length > MAX_TEXTO) throw new Error(`${nombre}: máximo ${MAX_TEXTO} caracteres`);
  return t;
};

/** Normaliza lo que manda el cliente: descarta campos ajenos y falla con un mensaje claro */
export function validarItems(entrada: unknown): ItemPremio[] {
  if (!Array.isArray(entrada)) return [];
  if (entrada.length > MAX_ITEMS) throw new Error(`Máximo ${MAX_ITEMS} premios por registro`);
  return entrada.map((raw): ItemPremio => {
    const i = (raw ?? {}) as Record<string, unknown>;
    switch (i.tipo) {
      case "puntos":
        return { tipo: "puntos", cantidad: entero(i.cantidad, MAX_CANTIDAD, "Puntos") };
      case "incienso":
        return { tipo: "incienso", cantidad: entero(i.cantidad, MAX_CANTIDAD, "Incienso") };
      case "xp":
        return { tipo: "xp", cantidad: entero(i.cantidad, MAX_CANTIDAD, "XP") };
      case "carta": {
        const cartaId = entero(i.cartaId, 2_147_483_647, "Carta");
        const nombre = typeof i.nombre === "string" ? i.nombre.slice(0, 120) : "";
        if (i.modo === "completa") return { tipo: "carta", cartaId, nombre, modo: "completa" };
        return { tipo: "carta", cartaId, nombre, modo: "fragmentos", cantidad: entero(i.cantidad, MAX_FRAGMENTOS, "Fragmentos") };
      }
      case "vale":
        return { tipo: "vale", texto: texto(i.texto, "Vale") };
      case "exoneracion":
        return { tipo: "exoneracion", texto: texto(i.texto, "Exoneración") };
      case "extra":
        return { tipo: "extra", texto: texto(i.texto, "Premio extra") };
      default:
        throw new Error("Tipo de premio no válido");
    }
  });
}

/** Lectura tolerante de lo guardado en la base (Json) */
export function leerItems(valor: unknown): ItemPremio[] {
  try {
    return validarItems(valor);
  } catch {
    return [];
  }
}

export function textoItem(i: ItemPremio): string {
  switch (i.tipo) {
    case "puntos":
      return `${i.cantidad} puntos`;
    case "incienso":
      return `${i.cantidad} ${i.cantidad === 1 ? "grano" : "granos"} de incienso`;
    case "xp":
      return `${i.cantidad} XP`;
    case "carta":
      return i.modo === "completa"
        ? `Carta completa: ${i.nombre || "carta"}`
        : `${i.cantidad} ${i.cantidad === 1 ? "fragmento" : "fragmentos"} de ${i.nombre || "una carta"}`;
    case "vale":
      return `Vale por ${i.texto}`;
    case "exoneracion":
      return `Exoneración: ${i.texto}`;
    case "extra":
      return i.texto;
  }
}
