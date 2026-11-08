// Asistente del diario (lane 299): compactación del contexto. Cuando la conversación se acerca al límite del modelo, los turnos viejos se resumen con un turno
// corto sin herramientas y, desde entonces, al modelo se le manda el resumen + los turnos que siguen. El chat sigue mostrando todo. Reglas puras.
// Portado de vendor/moodiary/packages/feature/moodiary_assistant/lib/src/application/context_compaction_controller.dart (`maybeCompact`, `_pending`, `_summarize`),
// de data/assistant_defs.dart (constantes y `buildCompactionSystemPrompt`, que está en prompt.ts) y de presentation/assistant_page.dart (`_compactionMessages`, armado del
// historial con el resumen; ZhuJHua/moodiary@2c552dd). Diferencias (LANE_299 del vault): el límite de contexto es un ajuste, y el resumen incluye el bloque
// `[tools already run]`, que es lo que ve el modelo.

import { citaParaElModelo } from "./citas.ts";
import { CONTINUAR_PARA_EL_MODELO, MARCA_CONTINUAR, registroDe } from "./herramientas.ts";
import type { MensajeIA } from "./protocolos.ts";
import type { Compactada, TurnoChat } from "./sesiones.ts";

/** moodiary `assistantCompactionTriggerRatio`. */
export const RAZON_DISPARO = 0.75;
/** moodiary `assistantCompactionTailMessages`: los últimos mensajes nunca se resumen. */
export const COLA_SIN_RESUMIR = 8;
/** moodiary `assistantCompactionMinMessages`. */
export const MIN_MENSAJES_COMPACTAR = 8;
/** moodiary `assistantCompactionSummaryMaxTokens`. */
export const MAX_TOKENS_RESUMEN = 768;
/** moodiary `assistantDefaultContextBudget`. */
export const PRESUPUESTO_CONTEXTO = 32_000;
export const MIN_CONTEXTO = 4_000;
export const MAX_CONTEXTO = 2_000_000;
export const MAX_RESUMEN = 8_000;
/** Cuántos turnos como mucho se mandan al modelo cuando no hay resumen. */
export const TURNOS_AL_MODELO = 80;

export const ENCABEZADO_RESUMEN_PREVIO = "[Earlier summary]";
export const ENCABEZADO_RESUMEN = "[Summary of earlier conversation]";
export const ACUSE_DEL_RESUMEN = "Understood — I have the earlier context.";
export const PEDIDO_DE_RESUMEN = "Summarize the conversation above following your instructions.";

/** El límite de contexto que se guarda: un entero entre {@link MIN_CONTEXTO} y {@link MAX_CONTEXTO}; si no sirve, el de moodiary. */
export function limiteDeContexto(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  if (!Number.isFinite(n)) return PRESUPUESTO_CONTEXTO;
  return Math.min(MAX_CONTEXTO, Math.max(MIN_CONTEXTO, Math.trunc(n)));
}

// ── Lo que ve el modelo de cada turno ───────────────────────────────────────

/** El mensaje que el modelo recibe por un turno guardado (o `null` si no aporta nada). Los turnos del asistente llevan delante `[tools already run]`. */
export function mensajeDeTurno(t: TurnoChat): { rol: "usuario" | "asistente"; texto: string } | null {
  if (t.deUsuario) {
    const texto = t.texto.trim() === MARCA_CONTINUAR ? CONTINUAR_PARA_EL_MODELO : citaParaElModelo(t.texto);
    return texto.trim() ? { rol: "usuario", texto } : null;
  }
  const cuerpo = [registroDe(t.llamadas), t.texto.trim()].filter(Boolean).join("\n\n");
  return cuerpo ? { rol: "asistente", texto: cuerpo } : null;
}

export interface MensajeCompactable {
  id: string;
  deUsuario: boolean;
  texto: string;
}

/** moodiary `_compactionMessages`: los turnos con contenido, en orden. */
export function compactables(turnos: TurnoChat[]): MensajeCompactable[] {
  const salida: MensajeCompactable[] = [];
  for (const t of turnos) {
    const m = mensajeDeTurno(t);
    if (m) salida.push({ id: t.id, deUsuario: m.rol === "usuario", texto: m.texto });
  }
  return salida;
}

// ── Qué resumir y cuándo ────────────────────────────────────────────────────

export interface PorResumir {
  aResumir: MensajeCompactable[];
  /** Último mensaje que queda resumido: la nueva marca. */
  hastaId: string;
  /** El resumen anterior, si su marca sigue en la conversación. */
  resumenPrevio: string | null;
}

/** moodiary `_pending`: lo que está entre la marca anterior y la cola de mensajes que se conserva. `null` si no hay nada para resumir. */
export function pendienteDeResumir(compactada: Compactada | null, mensajes: MensajeCompactable[], cola = COLA_SIN_RESUMIR): PorResumir | null {
  if (mensajes.length <= cola) return null;
  const previos = mensajes.slice(0, mensajes.length - cola);
  let inicio = 0;
  let resumenPrevio: string | null = null;
  if (compactada) {
    const en = previos.findIndex((m) => m.id === compactada.hastaId);
    if (en >= 0) {
      inicio = en + 1;
      resumenPrevio = compactada.resumen;
    }
  }
  const aResumir = previos.slice(inicio);
  if (!aResumir.length) return null;
  return { aResumir, hastaId: previos[previos.length - 1].id, resumenPrevio };
}

export interface OpcionesCompactar {
  compactada: Compactada | null;
  mensajes: MensajeCompactable[];
  /** Tokens de entrada del último turno del asistente (lo que pesó el contexto la última vez). */
  entradaTokens: number;
  limiteContexto: number;
  /** «Compactar ahora»: se salta el umbral. */
  forzar?: boolean;
}

/** moodiary `maybeCompact` (la parte que decide): qué hay que resumir ahora, o `null`. */
export function porCompactar(o: OpcionesCompactar): PorResumir | null {
  if (!o.forzar) {
    if (o.mensajes.length < MIN_MENSAJES_COMPACTAR) return null;
    const presupuesto = o.limiteContexto > 0 ? o.limiteContexto : PRESUPUESTO_CONTEXTO;
    if (o.entradaTokens < presupuesto * RAZON_DISPARO) return null;
  }
  return pendienteDeResumir(o.compactada, o.mensajes);
}

// ── Mensajes ────────────────────────────────────────────────────────────────

/** Agrega un mensaje; si el anterior es del mismo rol los une (los proveedores no quieren dos seguidos de la misma voz). */
function agregar(salida: MensajeIA[], rol: "usuario" | "asistente", texto: string): void {
  const ultimo = salida[salida.length - 1];
  if (ultimo && ultimo.rol !== "resultado" && ultimo.rol === rol) {
    salida[salida.length - 1] = { ...ultimo, texto: `${ultimo.texto}\n\n${texto}` };
    return;
  }
  salida.push(rol === "usuario" ? { rol, texto } : { rol, texto, llamadas: [] });
}

/** moodiary `_summarize`: lo que se le manda al modelo para que resuma (el resumen anterior, los turnos y el pedido). Siempre empieza con la persona. */
export function mensajesParaResumir(resumenPrevio: string | null, aResumir: MensajeCompactable[]): MensajeIA[] {
  const salida: MensajeIA[] = [];
  if (resumenPrevio?.trim()) {
    agregar(salida, "usuario", `${ENCABEZADO_RESUMEN_PREVIO}\n${resumenPrevio.trim()}`);
    agregar(salida, "asistente", "OK.");
  }
  for (const m of aResumir) agregar(salida, m.deUsuario ? "usuario" : "asistente", m.texto);
  agregar(salida, "usuario", PEDIDO_DE_RESUMEN);
  while (salida.length && salida[0].rol !== "usuario") salida.shift();
  return salida;
}

/** El resumen que devolvió el modelo, listo para guardar; `null` si vino vacío. */
export function normalizarResumen(crudo: string): string | null {
  const t = crudo.trim();
  return t ? t.slice(0, MAX_RESUMEN) : null;
}

/** La marca nueva de la sesión. */
export const compactadaNueva = (resumen: string, hastaId: string, entradaTokens: number, ahora = Date.now()): Compactada => ({ resumen, hastaId, en: ahora, tokens: entradaTokens });

/**
 * Los turnos guardados → mensajes para el modelo. Con resumen, empieza por `[Summary of earlier conversation]` + el acuse, y sigue con los turnos que vienen
 * después de la marca (moodiary `assistant_page.dart`); sin resumen, con los últimos {@link TURNOS_AL_MODELO}. Los turnos seguidos de la misma voz se unen.
 */
export function historialConResumen(turnos: TurnoChat[], compactada: Compactada | null, maxTurnos = TURNOS_AL_MODELO): MensajeIA[] {
  const lista: { id: string; rol: "usuario" | "asistente"; texto: string }[] = [];
  for (const t of turnos) {
    const m = mensajeDeTurno(t);
    if (m) lista.push({ id: t.id, ...m });
  }
  let desde = 0;
  let conResumen = false;
  if (compactada?.resumen.trim()) {
    const en = lista.findIndex((m) => m.id === compactada.hastaId);
    if (en >= 0) {
      desde = en + 1;
      conResumen = true;
    }
  }
  const salida: MensajeIA[] = [];
  if (conResumen && compactada) {
    agregar(salida, "usuario", `${ENCABEZADO_RESUMEN}\n${compactada.resumen.trim()}`);
    agregar(salida, "asistente", ACUSE_DEL_RESUMEN);
  }
  for (const m of lista.slice(desde).slice(-maxTurnos)) agregar(salida, m.rol, m.texto);
  // Los proveedores exigen que la conversación empiece con la persona
  while (salida.length && salida[0].rol !== "usuario") salida.shift();
  return salida;
}
