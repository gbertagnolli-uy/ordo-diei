// Asistente del diario (lane 298): sesiones y mensajes del chat, y cómo se guardan en el navegador. Reglas puras (el almacenamiento real está en el componente).
// Portado de vendor/moodiary/.../application/chat_items.dart (`AssistantTurn`, `modelSwitchNoticesFor` no se porta) y de
// vendor/moodiary/packages/feature_base/moodiary_models/lib/src/{chat_session,assistant_tool_call}.dart (ZhuJHua/moodiary@2c552dd).
// El historial es solo local (decisión D4): ninguna sesión sube al servidor.

import type { LlamadaRegistrada } from "./herramientas.ts";
import { MODOS_PERMISO, MAX_NOTAS, modoPermisoDe, type ModoPermiso } from "./herramientas.ts";
import { limiteDeContexto, MAX_RESUMEN, PRESUPUESTO_CONTEXTO } from "./compactacion.ts";
import { proveedorValido, type Proveedor } from "./proveedores.ts";

export const VERSION_ALMACEN = 1;
export const MAX_SESIONES = 60;
export const MAX_MENSAJES_SESION = 400;
export const MAX_TEXTO_MENSAJE = 60_000;
export const MAX_RESULTADO_GUARDADO = 6000;

export interface TurnoChat {
  id: string;
  deUsuario: boolean;
  texto: string;
  /** Milisegundos desde 1970. */
  creadoEn: number;
  llamadas: LlamadaRegistrada[];
  modelo: string;
  proveedorId: string;
  entradaTokens: number;
  salidaTokens: number;
  /** El turno se cortó por longitud: se ofrece «seguir». */
  truncado: boolean;
  /** Mensaje de error del turno, si falló. */
  error: string | null;
}

/** Lane 299 (moodiary `compactedSummary` / `compactedUpToMessageId` / `compactedAt` / `compactedInputTokensAtTrigger`): los turnos hasta `hastaId` están resumidos. */
export interface Compactada {
  resumen: string;
  hastaId: string;
  /** Milisegundos desde 1970. */
  en: number;
  /** Tokens de entrada que tenía el contexto cuando se compactó. */
  tokens: number;
}

export interface Sesion {
  id: string;
  titulo: string;
  proveedorId: string;
  modelo: string;
  creadaEn: number;
  actualizadaEn: number;
  turnos: TurnoChat[];
  compactada: Compactada | null;
}

export interface Ajustes {
  modoPermiso: ModoPermiso;
  notas: string;
  /** Aceptó el aviso de privacidad (D3). */
  acepto: boolean;
  proveedorActivo: string | null;
  /** Lane 299 (moodiary `assistantMemoryEnabled`): el asistente guarda y recuerda hechos entre conversaciones. Por defecto sí. */
  memoria: boolean;
  /** Lane 299: tamaño del contexto del modelo en tokens; la compactación se dispara al pasar el 75 %. */
  contexto: number;
}

export const AJUSTES_INICIALES: Ajustes = { modoPermiso: "confirm", notas: "", acepto: false, proveedorActivo: null, memoria: true, contexto: PRESUPUESTO_CONTEXTO };

let secuencia = 0;
export const nuevoId = () => `${Date.now().toString(36)}${(secuencia++).toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const sesionNueva = (proveedorId: string, modelo: string, ahora = Date.now()): Sesion => ({ id: nuevoId(), titulo: "", proveedorId, modelo, creadaEn: ahora, actualizadaEn: ahora, turnos: [], compactada: null });

export function turnoDeUsuario(texto: string, ahora = Date.now()): TurnoChat {
  return { id: nuevoId(), deUsuario: true, texto, creadoEn: ahora, llamadas: [], modelo: "", proveedorId: "", entradaTokens: 0, salidaTokens: 0, truncado: false, error: null };
}

export function turnoDeAsistente(modelo: string, proveedorId: string, ahora = Date.now()): TurnoChat {
  return { id: nuevoId(), deUsuario: false, texto: "", creadoEn: ahora, llamadas: [], modelo, proveedorId, entradaTokens: 0, salidaTokens: 0, truncado: false, error: null };
}

// ── Lectura y escritura segura ──────────────────────────────────────────────

const num = (v: unknown, def = 0) => (typeof v === "number" && Number.isFinite(v) ? v : def);
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function llamadaValida(v: unknown): LlamadaRegistrada | null {
  if (typeof v !== "object" || v === null) return null;
  const l = v as Record<string, unknown>;
  const nombre = txt(l.nombre, 60);
  if (!nombre) return null;
  return { id: txt(l.id, 120), nombre, args: txt(l.args, 20_000), resultado: txt(l.resultado, MAX_RESULTADO_GUARDADO), hecha: l.hecha === true };
}

function turnoValido(v: unknown): TurnoChat | null {
  if (typeof v !== "object" || v === null) return null;
  const t = v as Record<string, unknown>;
  const id = txt(t.id, 60);
  if (!id) return null;
  return {
    id,
    deUsuario: t.deUsuario === true,
    texto: txt(t.texto, MAX_TEXTO_MENSAJE),
    creadoEn: num(t.creadoEn),
    llamadas: Array.isArray(t.llamadas) ? t.llamadas.map(llamadaValida).filter((l): l is LlamadaRegistrada => l !== null).slice(0, 80) : [],
    modelo: txt(t.modelo, 120),
    proveedorId: txt(t.proveedorId, 60),
    entradaTokens: num(t.entradaTokens),
    salidaTokens: num(t.salidaTokens),
    truncado: t.truncado === true,
    error: typeof t.error === "string" && t.error ? t.error.slice(0, 500) : null,
  };
}

function compactadaValida(v: unknown, turnos: TurnoChat[]): Compactada | null {
  if (typeof v !== "object" || v === null) return null;
  const c = v as Record<string, unknown>;
  const resumen = txt(c.resumen, MAX_RESUMEN).trim();
  const hastaId = txt(c.hastaId, 60);
  // Si el turno de la marca ya no está (la lista se recortó), el resumen no se puede ubicar y se descarta
  if (!resumen || !hastaId || !turnos.some((t) => t.id === hastaId)) return null;
  return { resumen, hastaId, en: num(c.en), tokens: num(c.tokens) };
}

export function sesionValida(v: unknown): Sesion | null {
  if (typeof v !== "object" || v === null) return null;
  const s = v as Record<string, unknown>;
  const id = txt(s.id, 60);
  if (!id) return null;
  const turnos = Array.isArray(s.turnos) ? s.turnos.map(turnoValido).filter((t): t is TurnoChat => t !== null).slice(-MAX_MENSAJES_SESION) : [];
  return { id, titulo: txt(s.titulo, 120), proveedorId: txt(s.proveedorId, 60), modelo: txt(s.modelo, 120), creadaEn: num(s.creadaEn), actualizadaEn: num(s.actualizadaEn), turnos, compactada: compactadaValida(s.compactada, turnos) };
}

export function sesionesValidas(v: unknown): Sesion[] {
  if (!Array.isArray(v)) return [];
  return v
    .map(sesionValida)
    .filter((s): s is Sesion => s !== null)
    .sort((a, b) => b.actualizadaEn - a.actualizadaEn)
    .slice(0, MAX_SESIONES);
}

export function ajustesValidos(v: unknown): Ajustes {
  if (typeof v !== "object" || v === null) return { ...AJUSTES_INICIALES };
  const a = v as Record<string, unknown>;
  return {
    modoPermiso: modoPermisoDe(a.modoPermiso),
    notas: txt(a.notas, MAX_NOTAS),
    acepto: a.acepto === true,
    proveedorActivo: typeof a.proveedorActivo === "string" && a.proveedorActivo ? a.proveedorActivo.slice(0, 60) : null,
    memoria: a.memoria !== false,
    contexto: limiteDeContexto(a.contexto),
  };
}

export function proveedoresValidos(v: unknown): Proveedor[] {
  if (!Array.isArray(v)) return [];
  const vistos = new Set<string>();
  const salida: Proveedor[] = [];
  for (const crudo of v) {
    const p = proveedorValido(crudo);
    if (!p || vistos.has(p.id)) continue;
    vistos.add(p.id);
    salida.push(p);
  }
  return salida.slice(0, 12);
}

/** Lo que se guarda: se acortan los resultados de herramientas para no llenar el almacenamiento del navegador. */
export function paraGuardar(sesiones: Sesion[]): Sesion[] {
  return sesiones.slice(0, MAX_SESIONES).map((s) => ({
    ...s,
    turnos: s.turnos.slice(-MAX_MENSAJES_SESION).map((t) => ({ ...t, llamadas: t.llamadas.map((l) => ({ ...l, resultado: l.resultado.slice(0, MAX_RESULTADO_GUARDADO) })) })),
  }));
}

export { MODOS_PERMISO };

// ── Lista de sesiones ───────────────────────────────────────────────────────

export type GrupoHistorial = "hoy" | "ultimos" | "antes";
const DIA = 86_400_000;

/** moodiary `_HistoryGroupLabel`: hoy, los últimos 7 días y antes. Los días son del reloj local de quien mira. */
export function grupoDe(actualizadaEn: number, ahora: Date): GrupoHistorial {
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  if (actualizadaEn >= inicioHoy) return "hoy";
  if (actualizadaEn >= inicioHoy - 6 * DIA) return "ultimos";
  return "antes";
}

export function agruparSesiones(sesiones: Sesion[], ahora: Date): { grupo: GrupoHistorial; sesiones: Sesion[] }[] {
  const orden = [...sesiones].sort((a, b) => b.actualizadaEn - a.actualizadaEn);
  const grupos: { grupo: GrupoHistorial; sesiones: Sesion[] }[] = [];
  for (const g of ["hoy", "ultimos", "antes"] as const) {
    const delGrupo = orden.filter((s) => grupoDe(s.actualizadaEn, ahora) === g);
    if (delGrupo.length) grupos.push({ grupo: g, sesiones: delGrupo });
  }
  return grupos;
}

/** El título que se muestra: el de la sesión, o el comienzo de lo primero que se preguntó. */
export function tituloVisible(s: Sesion): string {
  if (s.titulo) return s.titulo;
  const primero = s.turnos.find((t) => t.deUsuario)?.texto.replace(/^\[diary:\d+\]\n?/, "").replace(/\s+/g, " ").trim();
  return primero ? (primero.length > 60 ? `${primero.slice(0, 60)}…` : primero) : "Chat nuevo";
}

/** La clave del almacén local: una por usuario y por tipo de dato. */
export const claveAlmacen = (usuarioId: number, parte: "sesiones" | "ajustes" | "proveedores" | "claves" | "memoria") => `ordo-diei:asistente:v${VERSION_ALMACEN}:${usuarioId}:${parte}`;
