// Motor adaptativo del Camino de oración (vault/CAMINO_DE_ORACION.md).
// Puro y sin E/S: reproduce el historial de un usuario día por día con una máquina de XState
// y devuelve su estado. Nada se guarda: el estado siempre se recalcula desde los registros.
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { assign, initialTransition, setup, transition, type SnapshotFrom } from "xstate";
import { ESCALERAS, misteriosDelDia, type Dia, type Etapa, type Evento, type HabitoId, type Marca, type Paso } from "./catalogo.ts";

export * from "./catalogo.ts";

// ---------- Constancia (fórmula diaria de Loop Habit Tracker) ----------

export const MULTIPLICADOR = Math.pow(0.5, 1 / 13);
export const UMBRAL = { consolidacion: 0.6, firme: 0.8, bajaConsolidacion: 0.5, bajaFirme: 0.7 };
const VENTANA_RECAIDA = 7;
const FALTAS_RECAIDA = 4;
const DIAS_INICIO = 7;
const DIAS_REGRESO = 3;

export function siguienteConstancia(previa: number, dia: Dia) {
  if (dia === "justificado") return previa;
  return previa * MULTIPLICADOR + (dia === "hecho" ? 1 - MULTIPLICADOR : 0);
}

// ---------- Máquina de etapas (XState) ----------

interface Contexto {
  pasos: number;
  paso: number;
  /** Días seguidos rezados en el paso actual (justificados no cortan) */
  seguidos: number;
  constancia: number;
  diasEnCamino: number;
  /** Últimos días no justificados: true = rezado */
  ventana: boolean[];
  completo: boolean;
  rezadosDesdeRecaida: number;
  /** Eventos del último día procesado */
  eventos: Evento[];
}

type DiaEvento = { type: "DIA"; dia: Dia };

function aplicarDia(c: Contexto, dia: Dia, pasos: Paso[]): Contexto {
  const n: Contexto = { ...c, eventos: [], diasEnCamino: c.diasEnCamino + 1, constancia: siguienteConstancia(c.constancia, dia) };
  if (dia === "justificado") return n;

  const rezado = dia === "hecho";
  n.seguidos = rezado ? c.seguidos + 1 : 0;
  n.ventana = [...c.ventana, rezado].slice(-VENTANA_RECAIDA);
  if (rezado && c.rezadosDesdeRecaida >= 0) {
    n.rezadosDesdeRecaida = c.rezadosDesdeRecaida + 1;
    if (n.rezadosDesdeRecaida === 1) n.eventos.push("regreso");
  }

  // Subida de paso: días seguidos requeridos por el paso actual
  const meta = pasos[n.paso].diasParaSubir;
  if (rezado && meta !== null && n.seguidos >= meta) {
    if (n.paso < pasos.length - 1) {
      n.paso += 1;
      n.seguidos = 0;
      n.eventos.push("ascenso");
    } else if (!n.completo) {
      n.completo = true;
      n.eventos.push("completo");
    }
  }

  // Recaída: 4 o más faltas en los últimos 7 días no justificados → baja un paso, sin culpa
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
    id: "habitoOracion",
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
      inicio: { always: [{ guard: "recayo", target: "retomando" }, { guard: "salioDeInicio", target: "construccion" }] },
      construccion: { always: [{ guard: "recayo", target: "retomando" }, { guard: "consolidado", target: "consolidacion" }] },
      consolidacion: {
        always: [
          { guard: "recayo", target: "retomando" },
          { guard: "firme", target: "firme" },
          { guard: "bajoConsolidacion", target: "construccion" },
        ],
      },
      firme: { always: [{ guard: "recayo", target: "retomando" }, { guard: "bajoFirme", target: "consolidacion" }] },
      retomando: { always: [{ guard: "recuperado", target: "construccion" }] },
    },
  });
}

const MAQUINAS = {
  completorium: crearMaquina(ESCALERAS.completorium),
  rosario: crearMaquina(ESCALERAS.rosario),
  matutinum: crearMaquina(ESCALERAS.matutinum),
};

// ---------- Reproducción del historial ----------

export interface PuntoTrayectoria {
  fecha: string;
  constancia: number;
  marca: Dia;
}

export interface EstadoHabito {
  habito: HabitoId;
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
}

export const claveDia = (d: Date) => format(d, "yyyy-MM-dd");
const sumarDias = (fecha: string, n: number) => claveDia(addDays(parseISO(fecha), n));

/**
 * Reproduce el camino de un hábito desde `desde` hasta `hoy` (claves yyyy-MM-dd).
 * Días anteriores a hoy sin registro cuentan como falta; hoy sin registro queda pendiente.
 */
export function reproducir(habito: HabitoId, desde: string, hoy: string, marcas: Map<string, Marca>): EstadoHabito {
  const maquina = MAQUINAS[habito];
  let [snap] = initialTransition(maquina);
  const trayectoria: PuntoTrayectoria[] = [];
  let recaidaEl: string | null = null;
  const dias = Math.max(0, differenceInCalendarDays(parseISO(hoy), parseISO(desde)));

  for (let i = 0; i <= dias; i++) {
    const fecha = sumarDias(desde, i);
    const marca = marcas.get(fecha);
    if (fecha === hoy && !marca) break;
    const dia: Dia = marca ?? "falta";
    [snap] = transition(maquina, snap, { type: "DIA", dia });
    if (snap.context.eventos.includes("recaida")) recaidaEl = fecha;
    trayectoria.push({ fecha, constancia: snap.context.constancia, marca: dia });
  }

  return resumir(habito, desde, snap, marcas.get(hoy) ?? null, recaidaEl, trayectoria, hoy);
}

function resumir(
  habito: HabitoId,
  desde: string,
  snap: SnapshotFrom<ReturnType<typeof crearMaquina>>,
  hoyMarca: Marca | null,
  recaidaEl: string | null,
  trayectoria: PuntoTrayectoria[],
  hoy: string
): EstadoHabito {
  const c = snap.context;
  const etapa = snap.value as Etapa;
  return {
    habito,
    desde,
    etapa,
    paso: c.paso,
    pasoActual: ESCALERAS[habito][c.paso],
    pasos: c.pasos,
    seguidos: c.seguidos,
    completo: c.completo,
    constancia: c.constancia,
    hoy: hoyMarca,
    eventos: hoyMarca && trayectoria.at(-1)?.fecha === hoy ? c.eventos : [],
    recaidaEl: etapa === "retomando" ? recaidaEl : null,
    trayectoria,
  };
}

// ---------- Plan completo de un usuario ----------

export interface PlanEntrada {
  /** Inicio del camino (Rosario y, si no hay registros previos, Completorium) */
  inicio: string;
  /** Habilitación manual de la mañana (un padre puede adelantarla) */
  matutinumDesde: string | null;
  hoy: string;
  registros: { habito: HabitoId; fecha: string; marca: Marca }[];
}

export interface EstadoPlan {
  hoy: string;
  misterios: ReturnType<typeof misteriosDelDia>;
  habitos: EstadoHabito[];
  /** Si la mañana todavía no está habilitada: cuánto le falta a la noche (constancia objetivo) */
  matutinumBloqueado: { constanciaNoche: number; objetivo: number } | null;
}

export function calcularPlan({ inicio, matutinumDesde, hoy, registros }: PlanEntrada): EstadoPlan {
  const marcas = (h: HabitoId) => new Map(registros.filter((r) => r.habito === h).map((r) => [r.fecha, r.marca] as const));
  const primera = (h: HabitoId) => registros.filter((r) => r.habito === h).map((r) => r.fecha).sort()[0];
  const min = (a: string, b?: string) => (b && b < a ? b : a);

  // Completorium puede tener días previos al inicio (la familia ya lo rezaba)
  const noche = reproducir("completorium", min(inicio, primera("completorium")), hoy, marcas("completorium"));
  const rosario = reproducir("rosario", min(inicio, primera("rosario")), hoy, marcas("rosario"));

  // La mañana se habilita el día siguiente a que la noche llega a Consolidación
  const consolidada = noche.trayectoria.find((p) => p.constancia >= UMBRAL.consolidacion)?.fecha;
  const automatica = consolidada ? sumarDias(consolidada, 1) : null;
  const desdeManana = [matutinumDesde, automatica].filter((d): d is string => !!d).sort()[0] ?? null;

  const habitos = [noche, rosario];
  if (desdeManana && desdeManana <= hoy) {
    habitos.unshift(reproducir("matutinum", min(desdeManana, primera("matutinum")), hoy, marcas("matutinum")));
  }

  return {
    hoy,
    misterios: misteriosDelDia(hoy),
    habitos,
    matutinumBloqueado: desdeManana && desdeManana <= hoy ? null : { constanciaNoche: noche.constancia, objetivo: UMBRAL.consolidacion },
  };
}
