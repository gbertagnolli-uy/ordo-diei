// Información, franjas horarias y fotos de las 8 Horas del Breviario (SPEC liturgia §10.2, S8, S10).
import type { Hora } from "./tipos.ts";

export const APP_TZ = process.env.APP_TZ || "America/Montevideo";

export type InfoHora = {
  hora: Hora;
  tituloLatino: string; // "Ad Matutinum"
  castellano: string; // "Maitines"
  franja: string; // "00:00–04:59"
  inicioMin: number;
  finMin: number;
  fotoId: string;
  fotoUrl: string;
  autorNombre: string;
  autorUrl: string;
};

export const HORAS_INFO: Record<Hora, InfoHora> = {
  Matutinum: {
    hora: "Matutinum",
    tituloLatino: "Ad Matutinum",
    castellano: "Maitines",
    franja: "00:00–04:59",
    inicioMin: 0,
    finMin: 299,
    fotoId: "y9L5-ncGWQU",
    fotoUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80&auto=format&fit=crop",
    autorNombre: "Vincentiu Solomon",
    autorUrl: "https://unsplash.com/@vincentiu",
  },
  Laudes: {
    hora: "Laudes",
    tituloLatino: "Ad Laudes",
    castellano: "Laudes",
    franja: "05:00–06:59",
    inicioMin: 300,
    finMin: 419,
    fotoId: "eOpewngf68w",
    fotoUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1280&q=80&auto=format&fit=crop",
    autorNombre: "Dawid Zawiła",
    autorUrl: "https://unsplash.com/@dawidzawila",
  },
  Prima: {
    hora: "Prima",
    tituloLatino: "Ad Primam",
    castellano: "Prima",
    franja: "07:00–08:29",
    inicioMin: 420,
    finMin: 509,
    fotoId: "8c7L2ygB4e8",
    fotoUrl: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1280&q=80&auto=format&fit=crop",
    autorNombre: "Luca Bravo",
    autorUrl: "https://unsplash.com/@lucabravo",
  },
  Tertia: {
    hora: "Tertia",
    tituloLatino: "Ad Tertiam",
    castellano: "Tercia",
    franja: "08:30–10:59",
    inicioMin: 510,
    finMin: 659,
    fotoId: "5AI3nSddp3w",
    fotoUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&q=80&auto=format&fit=crop",
    autorNombre: "Kalum Brooks",
    autorUrl: "https://unsplash.com/@kalumbrooks",
  },
  Sexta: {
    hora: "Sexta",
    tituloLatino: "Ad Sextam",
    castellano: "Sexta",
    franja: "11:00–13:29",
    inicioMin: 660,
    finMin: 809,
    fotoId: "aqxb4sLOrfs",
    fotoUrl: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1280&q=80&auto=format&fit=crop",
    autorNombre: "Sander Weeteling",
    autorUrl: "https://unsplash.com/@sanderweeteling",
  },
  Nona: {
    hora: "Nona",
    tituloLatino: "Ad Nonam",
    castellano: "Nona",
    franja: "13:30–15:59",
    inicioMin: 810,
    finMin: 959,
    fotoId: "k-n0v97_4YQ",
    fotoUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1280&q=80&auto=format&fit=crop",
    autorNombre: "Eberhard Grossgasteiger",
    autorUrl: "https://unsplash.com/@eberhardgross",
  },
  Vespera: {
    hora: "Vespera",
    tituloLatino: "Ad Vesperas",
    castellano: "Vísperas",
    franja: "16:00–19:29",
    inicioMin: 960,
    finMin: 1169,
    fotoId: "pwcKF7L4-no",
    fotoUrl: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1280&q=80&auto=format&fit=crop",
    autorNombre: "Jordan Wozniak",
    autorUrl: "https://unsplash.com/@jordanwozniak",
  },
  Completorium: {
    hora: "Completorium",
    tituloLatino: "Ad Completorium",
    castellano: "Completas",
    franja: "19:30–23:59",
    inicioMin: 1170,
    finMin: 1439,
    fotoId: "KMn4VEeEPR8",
    fotoUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=1280&q=80&auto=format&fit=crop",
    autorNombre: "Benjamin Davies",
    autorUrl: "https://unsplash.com/@bendavisual",
  },
};

export const LISTA_HORAS: InfoHora[] = [
  HORAS_INFO.Matutinum,
  HORAS_INFO.Laudes,
  HORAS_INFO.Prima,
  HORAS_INFO.Tertia,
  HORAS_INFO.Sexta,
  HORAS_INFO.Nona,
  HORAS_INFO.Vespera,
  HORAS_INFO.Completorium,
];

/**
 * Determina la Hora del Breviario vigente según los minutos del día en `timezone` (SPEC §10.2, S8).
 */
export function horaActual(ahora: Date = new Date(), timezone: string = APP_TZ): Hora {
  const formateador = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const partes = formateador.formatToParts(ahora);
  const horaStr = partes.find((p) => p.type === "hour")?.value ?? "00";
  const minStr = partes.find((p) => p.type === "minute")?.value ?? "00";
  const minutosDesdeMedianoche = Number(horaStr) * 60 + Number(minStr);

  for (const info of LISTA_HORAS) {
    if (minutosDesdeMedianoche >= info.inicioMin && minutosDesdeMedianoche <= info.finMin) {
      return info.hora;
    }
  }
  return "Matutinum";
}

/**
 * Devuelve la lista de las 8 Horas ordenadas cronológicamente a partir de la siguiente a la destacada (SPEC §10.2).
 */
export function horasOrdenadasDesde(horaDestacada: Hora): InfoHora[] {
  const idx = LISTA_HORAS.findIndex((h) => h.hora === horaDestacada);
  if (idx === -1) return LISTA_HORAS;
  return [...LISTA_HORAS.slice(idx + 1), ...LISTA_HORAS.slice(0, idx + 1)];
}
