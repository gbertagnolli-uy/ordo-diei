// Diario (lane 286): reglas puras de las plantillas. Sin base de datos, con tests.
// Portado de vendor/Daily_You/lib/template_renderer.dart, lib/providers/templates_provider.dart (`createDefaultTemplates`), lib/models/template.dart,
// lib/pages/edit_entry_page.dart (`_applyInsertedTemplateTags`) y lib/l10n/intl_es.arb (claves `templateDefault*`) (Demizo/Daily_You@7cc237d):
// variables `{{date}}` y `{{time}}` con formato opcional, 3 plantillas de ejemplo y etiquetas que acompañan a la plantilla.
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { docDesdeTexto, sanearDocumento, textoPlanoDe, VERSION_DOC, type NodoDoc } from "./contenido.ts";
import type { EtiquetaDeCatalogo, EtiquetaPuesta, GrupoDeCatalogo } from "./etiquetas.ts";

export const MAX_NOMBRE_PLANTILLA = 60;
export const MAX_PLANTILLAS_AMBITO = 100;
export const MAX_ETIQUETAS_PLANTILLA = 50;

// ── Variables ───────────────────────────────────────────────────────────────

/** `TemplateRenderer._variablePattern`: `{{nombre}}` o `{{nombre:formato}}`. */
const VARIABLE = /\{\{(\w+)(?::([^}]+))?\}\}/g;

/** Daily You usa `DateFormat.yMd` y la hora local: acá, día/mes/año y 24 horas (decisión P8). */
export const FORMATO_FECHA = "d/M/yyyy";
export const FORMATO_HORA = "HH:mm";

/**
 * `_formatDate` / `_formatTime`: aplica el formato de la variable (sintaxis de date-fns, casi igual a la de Dart); si no se puede aplicar,
 * usa el predeterminado en vez de fallar.
 */
export function formatear(cuando: Date, patron: string | undefined, predeterminado: string): string {
  const p = patron?.trim();
  if (p) {
    try {
      return format(cuando, p, { locale: es });
    } catch {
      /* formato que no se puede aplicar: se usa el predeterminado, como en Daily You */
    }
  }
  return format(cuando, predeterminado, { locale: es });
}

/** `TemplateRenderer.populate`: reemplaza `{{date}}` y `{{time}}`; las variables desconocidas quedan como estaban. */
export function poblar(texto: string, cuando: Date): string {
  return texto.replace(VARIABLE, (coincidencia, nombre: string, patron?: string) => {
    if (nombre === "date") return formatear(cuando, patron, FORMATO_FECHA);
    if (nombre === "time") return formatear(cuando, patron, FORMATO_HORA);
    return coincidencia;
  });
}

/** Lo mismo sobre un documento: se reemplaza dentro de cada trozo de texto (una variable partida entre dos estilos distintos no se reconoce). */
export function poblarDocumento(doc: NodoDoc, cuando: Date): NodoDoc {
  const copiar = (n: NodoDoc): NodoDoc => ({
    ...n,
    ...(n.type === "text" && typeof n.text === "string" ? { text: poblar(n.text, cuando) } : {}),
    ...(n.content ? { content: n.content.map(copiar) } : {}),
  });
  return copiar(doc);
}

/** La fecha y hora de la entrada ("YYYY-MM-DD" y minutos desde la medianoche) como `Date` local (decisión P3). */
export function cuandoDe(dia: string, minutos: number): Date {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(a, m - 1, d, Math.floor(minutos / 60), minutos % 60);
}

// ── Validación ──────────────────────────────────────────────────────────────

export interface PlantillaValida {
  nombre: string;
  contenido: NodoDoc;
  /** Texto plano derivado del contenido. */
  texto: string;
  /** Etiquetas que se ponen al usarla. `undefined` = el cuerpo no las trae: no se tocan. */
  etiquetas?: number[];
  /** `undefined` = no se toca. */
  predeterminada?: boolean;
}

const limpiarTitulo = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

export function validarPlantilla(b: Record<string, unknown>): PlantillaValida {
  const nombre = limpiarTitulo(b.nombre);
  if (!nombre) throw new Error("Poné un nombre");
  if (nombre.length > MAX_NOMBRE_PLANTILLA) throw new Error(`El nombre admite hasta ${MAX_NOMBRE_PLANTILLA} caracteres`);
  // Una plantilla puede quedar vacía (Daily You guarda el texto aunque no tenga nada)
  const contenido = b.contenido === undefined || b.contenido === null ? docDesdeTexto("") : sanearDocumento(b.contenido);
  let etiquetas: number[] | undefined;
  if (b.etiquetas !== undefined) {
    if (!Array.isArray(b.etiquetas)) throw new Error("Etiquetas inválidas");
    if (b.etiquetas.length > MAX_ETIQUETAS_PLANTILLA) throw new Error(`Una plantilla admite hasta ${MAX_ETIQUETAS_PLANTILLA} etiquetas`);
    if (b.etiquetas.some((x) => typeof x !== "number" || !Number.isInteger(x) || x <= 0)) throw new Error("Etiquetas inválidas");
    etiquetas = [...new Set(b.etiquetas as number[])];
  }
  if (b.predeterminada !== undefined && typeof b.predeterminada !== "boolean") throw new Error("Predeterminada inválida");
  return {
    nombre,
    contenido,
    texto: textoPlanoDe(contenido).trim(),
    ...(etiquetas ? { etiquetas } : {}),
    ...(b.predeterminada !== undefined ? { predeterminada: b.predeterminada as boolean } : {}),
  };
}

// ── Etiquetas de la plantilla ───────────────────────────────────────────────

/**
 * Daily You `_applyInsertedTemplateTags`: al usar una plantilla se suman sus etiquetas a la entrada.
 * No pisa lo ya elegido: omite las que ya están, las que ya no existen, los contadores (necesitan un valor; decisión P6) y las de un grupo
 * de selección única que ya tiene una (decisión P7).
 */
export function fusionarEtiquetas(puestas: EtiquetaPuesta[], deLaPlantilla: number[], etiquetas: EtiquetaDeCatalogo[], grupos: GrupoDeCatalogo[]): EtiquetaPuesta[] {
  const porId = new Map(etiquetas.map((e) => [e.id, e]));
  const unicas = new Set(grupos.filter((g) => g.seleccionUnica).map((g) => g.id));
  const gruposUsados = new Set<number>();
  for (const p of puestas) {
    const g = porId.get(p.id)?.grupoId;
    if (g != null && unicas.has(g)) gruposUsados.add(g);
  }
  const salida = [...puestas];
  const ids = new Set(puestas.map((p) => p.id));
  for (const id of deLaPlantilla) {
    const e = porId.get(id);
    if (!e || ids.has(id) || e.tipo === "contador") continue;
    if (e.grupoId != null && unicas.has(e.grupoId)) {
      if (gruposUsados.has(e.grupoId)) continue;
      gruposUsados.add(e.grupoId);
    }
    ids.add(id);
    salida.push({ id, valor: null });
  }
  return salida;
}

// ── Plantillas de ejemplo ───────────────────────────────────────────────────

const texto = (t: string): NodoDoc => ({ type: "text", text: t });
const parrafo = (t?: string): NodoDoc => (t ? { type: "paragraph", content: [texto(t)] } : { type: "paragraph" });
const titulo3 = (t: string): NodoDoc => ({ type: "heading", attrs: { level: 3 }, content: [texto(t)] });
const lista = (): NodoDoc => ({ type: "bulletList", content: [{ type: "listItem", content: [parrafo()] }] });
const cita = (): NodoDoc => ({ type: "blockquote", content: [parrafo()] });
const documento = (...bloques: NodoDoc[]): NodoDoc => ({ type: "doc", attrs: { v: VERSION_DOC }, content: bloques });

export interface PlantillaSemilla {
  nombre: string;
  contenido: NodoDoc;
}

/** `createDefaultTemplates` (textos de `intl_es.arb`): fecha y hora, resumen del día y reflexión, con el cuerpo en el editor de la app. */
export const SEMILLA_PLANTILLAS: PlantillaSemilla[] = [
  { nombre: "Fecha y hora", contenido: documento(parrafo("{{date}} - {{time}}:")) },
  { nombre: "Resumen del día", contenido: documento(titulo3("Resumen"), lista(), titulo3("Cita"), cita()) },
  {
    nombre: "Reflexión",
    contenido: documento(titulo3("¿Qué te gustó hoy?"), lista(), titulo3("¿Por qué estás agradecido/a?"), lista(), titulo3("¿Qué estás esperando?"), lista()),
  },
];
