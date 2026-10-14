// Información, franjas horarias y fotos de las 8 Horas del Breviario (SPEC liturgia §10.2, S8, S10).
// Las 8 fotos se eligieron buscando en la API de Unsplash por la luz de cada franja (id, autor y enlaces vienen de la
// respuesta de la API, no de memoria) y se registró su descarga una vez. Contraste del texto blanco: scripts/liturgia/medir-contraste.py.
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
  /** Página de la foto en Unsplash (con UTM), para la atribución. */
  paginaUrl: string;
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
    fotoId: "jKZ2iUsaqXk",
    fotoUrl: "https://images.unsplash.com/photo-1641895958846-19dab3471449?ixid=M3wxMTAyMTUyfDB8MXxzZWFyY2h8MXx8c3RhcnJ5JTIwbmlnaHQlMjBza3klMjBzdGFycyUyMG5hdHVyZXxlbnwxfDB8fHwxNzkyMDE1MzY4fDA&ixlib=rb-4.1.0&w=1280&q=80&auto=format&fit=crop",
    paginaUrl: "https://unsplash.com/photos/the-night-sky-is-filled-with-stars-and-trees-jKZ2iUsaqXk?utm_source=ordo_diei&utm_medium=referral",
    autorNombre: "Luca Nicoletti",
    autorUrl: "https://unsplash.com/@luca_nicoletti?utm_source=ordo_diei&utm_medium=referral",
  },
  Laudes: {
    hora: "Laudes",
    tituloLatino: "Ad Laudes",
    castellano: "Laudes",
    franja: "05:00–06:59",
    inicioMin: 300,
    finMin: 419,
    fotoId: "DaU0QlbxFvk",
    fotoUrl: "https://images.unsplash.com/photo-1567426077249-e04addfe3ff4?ixid=M3wxMTAyMTUyfDB8MXxzZWFyY2h8Nnx8c3VucmlzZSUyMGRhd24lMjBtb3VudGFpbnN8ZW58MXwwfHx8MTc5MjAxNTM2OXww&ixlib=rb-4.1.0&w=1280&q=80&auto=format&fit=crop",
    paginaUrl: "https://unsplash.com/photos/silhouette-of-mountain-during-golden-hour-DaU0QlbxFvk?utm_source=ordo_diei&utm_medium=referral",
    autorNombre: "Mike Lewinski",
    autorUrl: "https://unsplash.com/@ikewinski?utm_source=ordo_diei&utm_medium=referral",
  },
  Prima: {
    hora: "Prima",
    tituloLatino: "Ad Primam",
    castellano: "Prima",
    franja: "07:00–08:29",
    inicioMin: 420,
    finMin: 509,
    fotoId: "od287vQyufw",
    fotoUrl: "https://images.unsplash.com/photo-1543968996-ee822b8176ba?ixid=M3wxMTAyMTUyfDB8MXxzZWFyY2h8NHx8ZWFybHklMjBtb3JuaW5nJTIwbWlzdCUyMGZvcmVzdHxlbnwxfDB8fHwxNzkyMDE1MzY5fDA&ixlib=rb-4.1.0&w=1280&q=80&auto=format&fit=crop",
    paginaUrl: "https://unsplash.com/photos/evergreen-forest-shrouded-in-fog-od287vQyufw?utm_source=ordo_diei&utm_medium=referral",
    autorNombre: "Dave Hoefler",
    autorUrl: "https://unsplash.com/@iamthedave?utm_source=ordo_diei&utm_medium=referral",
  },
  Tertia: {
    hora: "Tertia",
    tituloLatino: "Ad Tertiam",
    castellano: "Tercia",
    franja: "08:30–10:59",
    inicioMin: 510,
    finMin: 659,
    fotoId: "d2SGcWSo4fA",
    fotoUrl: "https://images.unsplash.com/photo-1750836375552-296398b000bb?ixid=M3wxMTAyMTUyfDB8MXxzZWFyY2h8NXx8bW9ybmluZyUyMGxpZ2h0JTIwbWVhZG93fGVufDF8MHx8fDE3OTIwMTUzNzB8MA&ixlib=rb-4.1.0&w=1280&q=80&auto=format&fit=crop",
    paginaUrl: "https://unsplash.com/photos/golden-sunlight-bathes-a-field-of-wildflowers-d2SGcWSo4fA?utm_source=ordo_diei&utm_medium=referral",
    autorNombre: "Julian Rösner",
    autorUrl: "https://unsplash.com/@kipfarl?utm_source=ordo_diei&utm_medium=referral",
  },
  Sexta: {
    hora: "Sexta",
    tituloLatino: "Ad Sextam",
    castellano: "Sexta",
    franja: "11:00–13:29",
    inicioMin: 660,
    finMin: 809,
    fotoId: "OVX3oiL5PsE",
    fotoUrl: "https://images.unsplash.com/photo-1604949210966-9440c324823f?ixid=M3wxMTAyMTUyfDB8MXxzZWFyY2h8Mnx8bWlkZGF5JTIwc3VuJTIwYmx1ZSUyMHNreSUyMGxhbmRzY2FwZXxlbnwxfDB8fHwxNzkyMDE1MzcxfDA&ixlib=rb-4.1.0&w=1280&q=80&auto=format&fit=crop",
    paginaUrl: "https://unsplash.com/photos/low-sun-over-golden-desert-hills-OVX3oiL5PsE?utm_source=ordo_diei&utm_medium=referral",
    autorNombre: "Mick Haupt",
    autorUrl: "https://unsplash.com/@rocinante_11?utm_source=ordo_diei&utm_medium=referral",
  },
  Nona: {
    hora: "Nona",
    tituloLatino: "Ad Nonam",
    castellano: "Nona",
    franja: "13:30–15:59",
    inicioMin: 810,
    finMin: 959,
    fotoId: "yG1SrC_seWw",
    fotoUrl: "https://images.unsplash.com/photo-1754167935308-6c89000e3c9f?ixid=M3wxMTAyMTUyfDB8MXxzZWFyY2h8Mnx8YWZ0ZXJub29uJTIwZ29sZGVuJTIwbGlnaHQlMjBmaWVsZHxlbnwxfDB8fHwxNzkyMDE1MzcxfDA&ixlib=rb-4.1.0&w=1280&q=80&auto=format&fit=crop",
    paginaUrl: "https://unsplash.com/photos/sunlight-shines-on-a-vast-green-field-yG1SrC_seWw?utm_source=ordo_diei&utm_medium=referral",
    autorNombre: "Zed Can",
    autorUrl: "https://unsplash.com/@zedcan77?utm_source=ordo_diei&utm_medium=referral",
  },
  Vespera: {
    hora: "Vespera",
    tituloLatino: "Ad Vesperas",
    castellano: "Vísperas",
    franja: "16:00–19:29",
    inicioMin: 960,
    finMin: 1169,
    fotoId: "4V8JxijgZ_c",
    fotoUrl: "https://images.unsplash.com/photo-1474524955719-b9f87c50ce47?ixid=M3wxMTAyMTUyfDB8MXxzZWFyY2h8NHx8c3Vuc2V0JTIwbGFuZHNjYXBlfGVufDF8MHx8fDE3OTIwMTUzNzJ8MA&ixlib=rb-4.1.0&w=1280&q=80&auto=format&fit=crop",
    paginaUrl: "https://unsplash.com/photos/shoreline-during-golden-hour-4V8JxijgZ_c?utm_source=ordo_diei&utm_medium=referral",
    autorNombre: "frank mckenna",
    autorUrl: "https://unsplash.com/@frankiefoto?utm_source=ordo_diei&utm_medium=referral",
  },
  Completorium: {
    hora: "Completorium",
    tituloLatino: "Ad Completorium",
    castellano: "Completas",
    franja: "19:30–23:59",
    inicioMin: 1170,
    finMin: 1439,
    fotoId: "ir24Z8Kxr3s",
    fotoUrl: "https://images.unsplash.com/photo-1564092112576-539896333c07?ixid=M3wxMTAyMTUyfDB8MXxzZWFyY2h8Nnx8ZHVzayUyMHR3aWxpZ2h0JTIwbGFrZXxlbnwxfDB8fHwxNzkyMDE1MzcyfDA&ixlib=rb-4.1.0&w=1280&q=80&auto=format&fit=crop",
    paginaUrl: "https://unsplash.com/photos/purple-sky-over-lake-with-wooden-dusk-at-sunset-ir24Z8Kxr3s?utm_source=ordo_diei&utm_medium=referral",
    autorNombre: "Josh Duncan",
    autorUrl: "https://unsplash.com/@joshbduncan?utm_source=ordo_diei&utm_medium=referral",
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
