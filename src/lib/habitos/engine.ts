// Motor adaptativo de hábitos (vault/HABITOS_Y_NIVELES.md).
// Puro y sin E/S: reproduce el historial día por día con XState 5 y devuelve su estado.
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { assign, initialTransition, setup, transition, type SnapshotFrom } from "xstate";
import {
  DIAS_TODOS,
  programado,
  type Dia,
  type Etapa,
  type Evento,
  type Marca,
  type Paso,
} from "./catalogo.ts";

export * from "./catalogo.ts";

// ---------- Constancia (fórmula diaria de Loop Habit Tracker) ----------

export const MULTIPLICADOR = Math.pow(0.5, 1 / 13);
export const UMBRAL = { consolidacion: 0.6, firme: 0.8, bajaConsolidacion: 0.5, bajaFirme: 0.7 };
const VENTANA_RECAIDA = 7;
const FALTAS_RECAIDA = 4;
const DIAS_INICIO = 7;
const DIAS_REGRESO = 3;

export function siguienteConstancia(previa: number, dia: Dia): number {
  if (dia === "justificado" || dia === "libre") return previa;
  return previa * MULTIPLICADOR + (dia === "hecho" ? 1 - MULTIPLICADOR : 0);
}

// ---------- Máquina de etapas (XState) ----------

interface Contexto {
  pasos: number;
  paso: number;
  /** Días seguidos cumplidos en el paso actual (justificados y libres no cortan) */
  seguidos: number;
  constancia: number;
  diasEnCamino: number;
  /** Últimos días evaluados (no justificados ni libres): true = hecho */
  ventana: boolean[];
  completo: boolean;
  rezadosDesdeRecaida: number;
  /** Eventos del último día procesado */
  eventos: Evento[];
}

type DiaEvento = { type: "DIA"; dia: Dia };

function aplicarDia(c: Contexto, dia: Dia, pasos: Paso[]): Contexto {
  const n: Contexto = {
    ...c,
    eventos: [],
    diasEnCamino: c.diasEnCamino + 1,
    constancia: siguienteConstancia(c.constancia, dia),
  };
  if (dia === "justificado" || dia === "libre") return n;

  const cumplido = dia === "hecho";
  n.seguidos = cumplido ? c.seguidos + 1 : 0;
  n.ventana = [...c.ventana, cumplido].slice(-VENTANA_RECAIDA);
  if (cumplido && c.rezadosDesdeRecaida >= 0) {
    n.rezadosDesdeRecaida = c.rezadosDesdeRecaida + 1;
    if (n.rezadosDesdeRecaida === 1) n.eventos.push("regreso");
  }

  // Subida de paso: días seguidos requeridos por el paso actual
  const meta = pasos[n.paso]?.diasParaSubir;
  if (cumplido && meta !== null && meta !== undefined && n.seguidos >= meta) {
    if (n.paso < pasos.length - 1) {
      n.paso += 1;
      n.seguidos = 0;
      n.eventos.push("ascenso");
    } else if (!n.completo) {
      n.completo = true;
      n.eventos.push("completo");
    }
  }

  // Recaída: 4 o más faltas en los últimos 7 días evaluados
  if (n.ventana.filter((r) => !r).length >= FALTAS_RECAIDA) {
    n.paso = Math.max(0, n.paso - 1);
    n.completo = false;
    n.seguidos = 0;
    n.ventana = [];
    n.rezadosDesdeRecaida = 0;
    n.eventos.push("recaida");
  }
  return n;
}

export function crearMaquina(pasos: Paso[]) {
  return setup({
    types: { context: {} as Contexto, events: {} as DiaEvento },
    actions: {
      registrar: assign(({ context, event }) => aplicarDia(context, event.dia, pasos)),
    },
    guards: {
      recayo: ({ context }) => context.eventos.includes("recaida"),
      salioDeInicio: ({ context }) => context.diasEnCamino >= DIAS_INICIO,
      consolidado: ({ context }) => context.constancia >= UMBRAL.consolidacion,
      firme: ({ context }) => context.constancia >= UMBRAL.firme,
      bajoConsolidacion: ({ context }) => context.constancia < UMBRAL.bajaConsolidacion,
      bajoFirme: ({ context }) => context.constancia < UMBRAL.bajaFirme,
      recuperado: ({ context }) => context.rezadosDesdeRecaida >= DIAS_REGRESO,
    },
  }).createMachine({
    id: "habitoMotor",
    context: {
      pasos: pasos.length,
      paso: 0,
      seguidos: 0,
      constancia: 0,
      diasEnCamino: 0,
      ventana: [],
      completo: false,
      rezadosDesdeRecaida: -1,
      eventos: [],
    },
    initial: "inicio",
    on: { DIA: { actions: "registrar" } },
    states: {
      inicio: {
        always: [
          { guard: "recayo", target: "retomando" },
          { guard: "salioDeInicio", target: "construccion" },
        ],
      },
      construccion: {
        always: [
          { guard: "recayo", target: "retomando" },
          { guard: "consolidado", target: "consolidacion" },
        ],
      },
      consolidacion: {
        always: [
          { guard: "recayo", target: "retomando" },
          { guard: "firme", target: "firme" },
          { guard: "bajoConsolidacion", target: "construccion" },
        ],
      },
      firme: {
        always: [
          { guard: "recayo", target: "retomando" },
          { guard: "bajoFirme", target: "consolidacion" },
        ],
      },
      retomando: {
        always: [{ guard: "recuperado", target: "construccion" }],
      },
    },
  });
}

// Máquinas memorizadas por firma de escalera
type MaquinaTipo = ReturnType<typeof crearMaquina>;
const MAQUINAS = new Map<string, MaquinaTipo>();

function getMaquina(pasos: Paso[]): MaquinaTipo {
  const clave = JSON.stringify(pasos);
  let maquina = MAQUINAS.get(clave);
  if (!maquina) {
    maquina = crearMaquina(pasos);
    MAQUINAS.set(clave, maquina);
  }
  return maquina;
}

// ---------- Reproducción del historial ----------

export interface PuntoTrayectoria {
  fecha: string;
  constancia: number;
  marca: Dia;
}

export interface EstadoMotor {
  desde: string;
  etapa: Etapa;
  paso: number;
  pasoActual: Paso;
  pasos: number;
  /** Días seguidos hacia el próximo paso */
  seguidos: number;
  completo: boolean;
  constancia: number;
  hoy: Marca | null;
  /** Eventos de hoy (si hoy ya se registró) para celebrar o acompañar */
  eventos: Evento[];
  /** Última recaída, si la etapa es "retomando" */
  recaidaEl: string | null;
  trayectoria: PuntoTrayectoria[];
  programadoHoy: boolean;
}

export const claveDia = (d: Date) => format(d, "yyyy-MM-dd");
export const sumarDias = (fecha: string, n: number) => claveDia(addDays(parseISO(fecha), n));

export interface ReproducirInput {
  pasos: Paso[];
  desde: string;
  hoy: string;
  marcas: Map<string, Marca>;
  dias?: number;
}

/**
 * Reproduce el camino de un hábito desde `desde` hasta `hoy` (claves yyyy-MM-dd).
 * Días anteriores a hoy sin registro cuentan como falta si están programados, o como libre si no.
 * Hoy sin registro queda pendiente.
 */
export function reproducir({
  pasos,
  desde,
  hoy,
  marcas,
  dias = DIAS_TODOS,
}: ReproducirInput): EstadoMotor {
  const maquina = getMaquina(pasos);
  let [snap] = initialTransition(maquina);
  const trayectoria: PuntoTrayectoria[] = [];
  let recaidaEl: string | null = null;

  if (parseISO(desde) > parseISO(hoy)) {
    const c = snap.context;
    return {
      desde,
      etapa: snap.value as Etapa,
      paso: c.paso,
      pasoActual: pasos[0],
      pasos: c.pasos,
      seguidos: 0,
      completo: false,
      constancia: 0,
      hoy: null,
      eventos: [],
      recaidaEl: null,
      trayectoria: [],
      programadoHoy: programado(dias, hoy),
    };
  }

  const numDias = Math.max(0, differenceInCalendarDays(parseISO(hoy), parseISO(desde)));

  for (let i = 0; i <= numDias; i++) {
    const fecha = sumarDias(desde, i);
    const marca = marcas.get(fecha);
    const esProgramado = programado(dias, fecha);

    // Hoy sin registro queda pendiente
    if (fecha === hoy && !marca) break;

    const dia: Dia = marca ?? (esProgramado ? "falta" : "libre");
    [snap] = transition(maquina, snap, { type: "DIA", dia });
    if (snap.context.eventos.includes("recaida")) recaidaEl = fecha;
    trayectoria.push({ fecha, constancia: snap.context.constancia, marca: dia });
  }

  return resumir(pasos, desde, snap, marcas.get(hoy) ?? null, recaidaEl, trayectoria, hoy, dias);
}

function resumir(
  pasos: Paso[],
  desde: string,
  snap: SnapshotFrom<ReturnType<typeof crearMaquina>>,
  hoyMarca: Marca | null,
  recaidaEl: string | null,
  trayectoria: PuntoTrayectoria[],
  hoy: string,
  dias: number
): EstadoMotor {
  const c = snap.context;
  const etapa = snap.value as Etapa;
  return {
    desde,
    etapa,
    paso: c.paso,
    pasoActual: pasos[c.paso] ?? pasos[0],
    pasos: c.pasos,
    seguidos: c.seguidos,
    completo: c.completo,
    constancia: c.constancia,
    hoy: hoyMarca,
    eventos: hoyMarca && trayectoria.at(-1)?.fecha === hoy ? c.eventos : [],
    recaidaEl: etapa === "retomando" ? recaidaEl : null,
    trayectoria,
    programadoHoy: programado(dias, hoy),
  };
}
