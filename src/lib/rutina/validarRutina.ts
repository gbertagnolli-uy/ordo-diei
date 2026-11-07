// Validación de la rutina familiar que guarda un padre (lane 259). Pura: sin base ni red.
import { CATEGORIAS_INFO, type DiasAplicables, type EtapaRutina, type RutinaSemanalConfig } from "./tipos.ts";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_ETAPAS = 100;

export type ResultadoValidacion =
  | { ok: true; etapas: EtapaRutina[]; semanalConfig: RutinaSemanalConfig }
  | { ok: false; error: string };

function diasValidos(d: unknown): d is DiasAplicables {
  if (d === "todos" || d === "laborables" || d === "finDeSemana") return true;
  return Array.isArray(d) && d.length > 0 && d.every((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

function semanalValida(s: unknown): s is RutinaSemanalConfig {
  if (!s || typeof s !== "object") return false;
  const v = s as Record<string, unknown>;
  return (
    Array.isArray(v.diasLaborables) &&
    v.diasLaborables.every((x) => typeof x === "string") &&
    typeof v.enfoqueSemanal === "string" &&
    typeof v.notasSabado === "string" &&
    typeof v.notasDomingo === "string"
  );
}

export function validarRutinaFamiliar(body: unknown): ResultadoValidacion {
  if (!body || typeof body !== "object") return { ok: false, error: "Falta la rutina" };
  const { etapas, semanalConfig } = body as { etapas?: unknown; semanalConfig?: unknown };
  if (!Array.isArray(etapas) || etapas.length === 0) return { ok: false, error: "La rutina necesita al menos una etapa" };
  if (etapas.length > MAX_ETAPAS) return { ok: false, error: `Máximo ${MAX_ETAPAS} etapas` };
  if (!semanalValida(semanalConfig)) return { ok: false, error: "Faltan las notas semanales" };

  const ids = new Set<string>();
  const limpias: EtapaRutina[] = [];
  for (const [i, e] of etapas.entries()) {
    const n = i + 1;
    if (!e || typeof e !== "object") return { ok: false, error: `Etapa ${n}: formato inválido` };
    const x = e as Record<string, unknown>;
    if (typeof x.id !== "string" || !x.id.trim()) return { ok: false, error: `Etapa ${n}: falta el id` };
    if (ids.has(x.id)) return { ok: false, error: `Etapa ${n}: id repetido` };
    ids.add(x.id);
    if (typeof x.titulo !== "string" || !x.titulo.trim() || x.titulo.length > 120) return { ok: false, error: `Etapa ${n}: título vacío o de más de 120 caracteres` };
    if (typeof x.horaInicio !== "string" || !HHMM.test(x.horaInicio)) return { ok: false, error: `Etapa ${n}: hora de inicio inválida` };
    if (typeof x.horaFin !== "string" || !HHMM.test(x.horaFin)) return { ok: false, error: `Etapa ${n}: hora de fin inválida` };
    // La de la noche cruza la medianoche (22:00 → 08:00): solo se rechaza inicio = fin
    if (x.horaInicio === x.horaFin) return { ok: false, error: `Etapa ${n}: empieza y termina a la misma hora` };
    if (typeof x.categoria !== "string" || !(x.categoria in CATEGORIAS_INFO)) return { ok: false, error: `Etapa ${n}: categoría desconocida` };
    if (typeof x.icono !== "string" || !x.icono) return { ok: false, error: `Etapa ${n}: falta el ícono` };
    if (typeof x.alarmaSonora !== "boolean") return { ok: false, error: `Etapa ${n}: alarma inválida` };
    if (typeof x.duracionMin !== "number" || x.duracionMin < 0) return { ok: false, error: `Etapa ${n}: duración inválida` };
    if (!diasValidos(x.diasSemana)) return { ok: false, error: `Etapa ${n}: días inválidos` };
    limpias.push(e as EtapaRutina);
  }
  limpias.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  return { ok: true, etapas: limpias, semanalConfig: semanalConfig as RutinaSemanalConfig };
}
