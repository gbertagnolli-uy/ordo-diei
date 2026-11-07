// Diario personal y familiar (lane 272, Plane #31). Reglas puras: sin base ni red.
// Escala de ánimo 1–5 basada en Daily You (Demizo/Daily_You@7cc237d, lib/models/mood.dart).

export type TipoDiario = "personal" | "familiar";

export const ANIMOS = [
  { valor: 1, etiqueta: "Muy mal", emoji: "😣" },
  { valor: 2, etiqueta: "Mal", emoji: "🙁" },
  { valor: 3, etiqueta: "Normal", emoji: "😐" },
  { valor: 4, etiqueta: "Bien", emoji: "🙂" },
  { valor: 5, etiqueta: "Muy bien", emoji: "😄" },
] as const;

export const MAX_TEXTO = 10_000;
export const MAX_TITULO = 120;
export const MAX_FOTOS = 4;
export const MAX_DIAS_ATRAS = 30;
export const MAX_ENTRADAS_DIA = 50;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const URL_ARCHIVO = /^\/api\/archivos\/[0-9a-f-]{36}$/i;

export interface EntradaValida {
  fecha: string;
  titulo: string | null;
  texto: string;
  animo: number | null;
  fotos: string[];
}

const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** `hoy` = día de hoy en la zona de la familia ("YYYY-MM-DD"). */
export function validarEntrada(e: Record<string, unknown>, hoy: string): EntradaValida {
  const fecha = String(e.fecha ?? hoy);
  if (!FECHA.test(fecha) || Number.isNaN(Date.parse(fecha))) throw new Error("Fecha inválida");
  const atras = diasEntre(fecha, hoy);
  if (atras < 0) throw new Error("No se puede escribir en un día que todavía no llegó");
  if (atras > MAX_DIAS_ATRAS) throw new Error(`Solo se puede escribir hasta ${MAX_DIAS_ATRAS} días atrás`);
  const texto = typeof e.texto === "string" ? e.texto.trim() : "";
  if (!texto) throw new Error("Escribí algo");
  if (texto.length > MAX_TEXTO) throw new Error(`Máximo ${MAX_TEXTO} caracteres`);
  const tituloCrudo = typeof e.titulo === "string" ? e.titulo.trim() : "";
  if (tituloCrudo.length > MAX_TITULO) throw new Error(`El título puede tener hasta ${MAX_TITULO} caracteres`);
  let animo: number | null = null;
  if (e.animo !== null && e.animo !== undefined && e.animo !== "") {
    animo = Number(e.animo);
    if (!Number.isInteger(animo) || animo < 1 || animo > 5) throw new Error("Ánimo inválido");
  }
  const fotos = Array.isArray(e.fotos) ? e.fotos.map(String) : [];
  if (fotos.length > MAX_FOTOS) throw new Error(`Hasta ${MAX_FOTOS} fotos`);
  if (fotos.some((f) => !URL_ARCHIVO.test(f))) throw new Error("Foto inválida");
  return { fecha, titulo: tituloCrudo || null, texto, animo, fotos };
}

type Lector = { id: number; esPadre: boolean };
type Entrada = { tipo: TipoDiario; autorId: number };

export const puedeVer = (e: Entrada, u: Lector) => e.tipo === "familiar" || e.autorId === u.id;
export const puedeEditar = (e: Entrada, u: Lector) => e.autorId === u.id;
export const puedeBorrar = (e: Entrada, u: Lector) => e.autorId === u.id || (e.tipo === "familiar" && u.esPadre);

/** Para el calendario y el resumen: ánimo del día (el de la última entrada con ánimo) y conteos. */
export function resumenMes(entradas: { fecha: string; animo: number | null; creadaEn: string }[]) {
  const porDia = new Map<string, { animo: number | null; creadaEn: string; cantidad: number }>();
  for (const e of entradas) {
    const d = porDia.get(e.fecha) ?? { animo: null, creadaEn: "", cantidad: 0 };
    d.cantidad++;
    if (e.animo !== null && e.creadaEn >= d.creadaEn) {
      d.animo = e.animo;
      d.creadaEn = e.creadaEn;
    }
    porDia.set(e.fecha, d);
  }
  const diasPorAnimo = [0, 0, 0, 0, 0];
  for (const d of porDia.values()) if (d.animo !== null) diasPorAnimo[d.animo - 1]++;
  return {
    dias: Object.fromEntries([...porDia].map(([f, d]) => [f, { animo: d.animo, cantidad: d.cantidad }])),
    totalEntradas: entradas.length,
    diasPorAnimo,
  };
}
