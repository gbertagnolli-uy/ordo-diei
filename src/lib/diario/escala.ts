// Diario (lane 286): escala de ánimo configurable. Reglas puras: sin base de datos, con tests.
// Portado de vendor/Daily_You/lib/models/{mood,mood_scale_level,mood_scale_preset}.dart, lib/providers/mood_scale_provider.dart y
// lib/utils/mood_scale_visuals.dart (Demizo/Daily_You@7cc237d): 5 niveles, cada uno con nombre opcional, ícono (emoji o del catálogo) y color,
// y 3 presets (emoji, íconos, colores). Sin filas guardadas rige la escala predeterminada (decisión P2).
import { esColor, validarIcono, type Actor, type TipoIcono } from "./etiquetas.ts";
import { ANIMOS, type TipoDiario } from "./reglas.ts";

export const MAX_NOMBRE_NIVEL = 24;
export const NIVELES = 5;

export interface NivelAnimo {
  /** 1 (muy mal) … 5 (muy bien). */
  valor: number;
  /** Nombre propio, o null = el predeterminado del nivel. */
  etiqueta: string | null;
  /** Emoji o clave del catálogo de íconos; null = un círculo. */
  icono: string | null;
  tipoIcono: TipoIcono;
  /** #rrggbb, o null = el color predeterminado del nivel (el de los tokens del tema). */
  color: string | null;
}

export type EscalaAnimo = NivelAnimo[];

/** Lo que había antes de la lane 286 (lane 272): cinco emojis y los nombres de `ANIMOS`. */
export const ESCALA_PREDETERMINADA: EscalaAnimo = ANIMOS.map((a) => ({ valor: a.valor, etiqueta: null, icono: a.emoji, tipoIcono: "emoji" as const, color: null }));

export type PresetEscala = "emoji" | "iconos" | "colores";

// Colores de Daily You (Material 500–700): rojo, azul claro, gris azulado, verde, ámbar / rojo, naranja, amarillo, verde, cian.
const COLORES_ANIMO = ["#f44336", "#039be5", "#607d8b", "#43a047", "#ffa000"];
const COLORES_PUNTOS = ["#f44336", "#fb8c00", "#fbc02d", "#43a047", "#0097a7"];

type Aspecto = Pick<NivelAnimo, "icono" | "tipoIcono" | "color">;

/** `MoodScalePreset`: emoji 😔😕😐🙂☺️, íconos (cara enojada … cara feliz) y cinco círculos de colores. */
export const PRESETS_ESCALA: Record<PresetEscala, { titulo: string; niveles: Aspecto[] }> = {
  emoji: {
    titulo: "Emoji",
    niveles: ["😔", "😕", "😐", "🙂", "☺️"].map((icono, i) => ({ icono, tipoIcono: "emoji" as const, color: COLORES_ANIMO[i] })),
  },
  iconos: {
    titulo: "Íconos",
    niveles: ["angry", "frown", "meh", "smile", "laugh"].map((icono, i) => ({ icono, tipoIcono: "icono" as const, color: COLORES_ANIMO[i] })),
  },
  colores: {
    titulo: "Colores",
    niveles: COLORES_PUNTOS.map((color) => ({ icono: "circle", tipoIcono: "icono" as const, color })),
  },
};

/** Daily You `_applyPreset`: cambia el aspecto de los 5 niveles y respeta los nombres que se habían puesto. */
export function aplicarPreset(escala: EscalaAnimo, preset: PresetEscala): EscalaAnimo {
  return escala.map((n, i) => ({ ...n, ...PRESETS_ESCALA[preset].niveles[i] }));
}

export const nombrePredeterminado = (valor: number): string => ANIMOS.find((a) => a.valor === valor)?.etiqueta ?? "";

/** Daily You `displayLabel`: el nombre propio o, si no hay, el predeterminado. */
export const nombreDeNivel = (n: Pick<NivelAnimo, "valor" | "etiqueta">): string => (n.etiqueta?.trim() ? n.etiqueta.trim() : nombrePredeterminado(n.valor));

/** Daily You `plainText`: el emoji si el ícono es un emoji; si no, el nombre. Para etiquetas de lectores de pantalla y texto plano. */
export const textoDeNivel = (n: NivelAnimo): string => (n.tipoIcono === "emoji" && n.icono ? n.icono : nombreDeNivel(n));

export const nivelDe = (escala: EscalaAnimo, valor: number | null): NivelAnimo | null => (valor === null ? null : (escala.find((n) => n.valor === valor) ?? null));

interface Fila {
  animo: number;
  etiqueta: string | null;
  icono: string | null;
  tipoIcono: TipoIcono;
  color: string | null;
}

/** Filas guardadas sobre la escala predeterminada: un nivel sin fila queda como estaba. */
export function completarEscala(filas: Fila[]): EscalaAnimo {
  return ESCALA_PREDETERMINADA.map((base) => {
    const f = filas.find((x) => x.animo === base.valor);
    return f ? { valor: base.valor, etiqueta: f.etiqueta, icono: f.icono, tipoIcono: f.tipoIcono, color: f.color } : base;
  });
}

/** Personal: cada quien la suya. Familiar: es de toda la familia y la cambia un padre. */
export const puedeCambiarEscala = (tipo: TipoDiario, actor: Actor) => tipo === "personal" || actor.esPadre;

/**
 * Cuerpo `{ niveles: [{ valor, etiqueta?, icono?, tipoIcono?, color? }] }` con los 5 niveles. El nombre vacío vuelve al predeterminado
 * (Daily You `_labelAt`); el ícono vacío se muestra como un círculo; el color vacío es el del tema.
 */
export function validarEscala(body: Record<string, unknown>): EscalaAnimo {
  const crudos = body.niveles;
  if (!Array.isArray(crudos) || crudos.length !== NIVELES) throw new Error(`La escala tiene que traer los ${NIVELES} niveles`);
  const vistos = new Set<number>();
  const niveles = crudos.map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    const valor = o.valor;
    if (typeof valor !== "number" || !Number.isInteger(valor) || valor < 1 || valor > NIVELES || vistos.has(valor)) throw new Error("Nivel inválido");
    vistos.add(valor);
    const nombre = typeof o.etiqueta === "string" ? o.etiqueta.replace(/\s+/g, " ").trim() : "";
    if (nombre.length > MAX_NOMBRE_NIVEL) throw new Error(`El nombre admite hasta ${MAX_NOMBRE_NIVEL} caracteres`);
    const { icono, tipoIcono } = validarIcono(o.icono, o.tipoIcono);
    let color: string | null = null;
    if (o.color != null && o.color !== "") {
      if (!esColor(o.color)) throw new Error("Color inválido");
      color = o.color.toLowerCase();
    }
    return { valor, etiqueta: nombre || null, icono, tipoIcono, color };
  });
  return niveles.sort((a, b) => a.valor - b.valor);
}
