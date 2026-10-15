import type { EtapaRutina, DiasAplicables } from "./tipos.ts";

/**
 * Convierte "HH:mm" a minutos desde medianoche (0 a 1439).
 */
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convierte minutos desde medianoche a string "HH:mm".
 * Maneja valores >= 1440 o negativos con módulo 1440.
 */
export function minutosAHora(minutos: number): string {
  const normalizados = ((Math.round(minutos) % 1440) + 1440) % 1440;
  const h = Math.floor(normalizados / 60);
  const m = normalizados % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Convierte un objeto Date a minutos del día con alta precisión (incluye segundos y milisegundos).
 */
export function dateAMinutos(fecha: Date): number {
  return (
    fecha.getHours() * 60 +
    fecha.getMinutes() +
    fecha.getSeconds() / 60 +
    fecha.getMilliseconds() / 60000
  );
}

/**
 * Determina si una etapa aplica para el día de la semana actual.
 * diaSemana: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
 */
export function esDiaAplicable(dias: DiasAplicables, diaSemana: number): boolean {
  if (dias === "todos") return true;
  if (dias === "laborables") return diaSemana >= 1 && diaSemana <= 5;
  if (dias === "finDeSemana") return diaSemana === 0 || diaSemana === 6;
  if (Array.isArray(dias)) return dias.includes(diaSemana);
  return true;
}

/**
 * Filtra las etapas que corresponden al día de la fecha dada.
 */
export function filtrarEtapasPorDia(etapas: EtapaRutina[], fecha: Date): EtapaRutina[] {
  const diaSemana = fecha.getDay();
  return etapas.filter((e) => esDiaAplicable(e.diasSemana, diaSemana));
}

/**
 * Verifica si un minuto dado cae dentro del intervalo de una etapa.
 * Soporta etapas que cruzan la medianoche (ej. 22:00 a 08:00).
 */
export function estaEnIntervalo(minutosActuales: number, inicioStr: string, finStr: string): boolean {
  const ini = horaAMinutos(inicioStr);
  const fin = horaAMinutos(finStr);

  if (ini < fin) {
    // Mismo día (ej. 09:00 a 09:25)
    return minutosActuales >= ini && minutosActuales < fin;
  } else if (ini > fin) {
    // Cruza medianoche (ej. 22:00 a 08:00)
    return minutosActuales >= ini || minutosActuales < fin;
  } else {
    return false;
  }
}

/**
 * Calcula la duración en segundos de una etapa, soportando cruce de medianoche.
 */
export function duracionEtapaSegundos(inicioStr: string, finStr: string): number {
  const ini = horaAMinutos(inicioStr);
  const fin = horaAMinutos(finStr);
  if (ini <= fin) {
    return (fin - ini) * 60;
  }
  return (24 * 60 - ini + fin) * 60;
}

/**
 * Encuentra la etapa activa actualmente según la fecha y hora provista.
 */
export function obtenerEtapaActual(
  etapas: EtapaRutina[],
  fecha: Date
): { etapa: EtapaRutina | null; index: number } {
  const etapasHoy = filtrarEtapasPorDia(etapas, fecha);
  if (!etapasHoy.length) return { etapa: null, index: -1 };

  const minActual = dateAMinutos(fecha);

  for (let i = 0; i < etapasHoy.length; i++) {
    const e = etapasHoy[i];
    if (estaEnIntervalo(minActual, e.horaInicio, e.horaFin)) {
      return { etapa: e, index: i };
    }
  }

  return { etapa: null, index: -1 };
}

/**
 * Encuentra la siguiente etapa que comenzará en el día o al día siguiente.
 */
export function obtenerProximaEtapa(
  etapas: EtapaRutina[],
  fecha: Date
): { etapa: EtapaRutina | null; restanteSeg: number } {
  const etapasHoy = filtrarEtapasPorDia(etapas, fecha);
  if (!etapasHoy.length) return { etapa: null, restanteSeg: 0 };

  const minActual = dateAMinutos(fecha);

  for (let i = 0; i < etapasHoy.length; i++) {
    const e = etapasHoy[i];
    const ini = horaAMinutos(e.horaInicio);
    if (ini > minActual) {
      const restanteSeg = Math.max(0, Math.round((ini - minActual) * 60));
      return { etapa: e, restanteSeg };
    }
  }

  // Próxima etapa es la primera de mañana
  const manana = new Date(fecha.getTime() + 24 * 3600 * 1000);
  const etapasManana = filtrarEtapasPorDia(etapas, manana);
  const primera = etapasManana[0] || etapasHoy[0];

  const iniManana = horaAMinutos(primera.horaInicio);
  const minutosHastaMedianoche = 24 * 60 - minActual;
  const restanteSeg = Math.max(0, Math.round((minutosHastaMedianoche + iniManana) * 60));

  return { etapa: primera, restanteSeg };
}

export interface ProgresoEtapa {
  totalSeg: number;
  transcurridoSeg: number;
  restanteSeg: number;
  porcentaje: number; // 0 a 100 (% entero)
  porcentajeRestante: number; // 100 a 0 (% exacto con decimales para animación continua)
  ratioRestante: number; // 0.0 a 1.0 exacto continuo para strokeDashoffset SVG
  fase: "verde" | "ambar" | "rojo";
}

/**
 * Calcula con precisión continua (subsegundo) el progreso y tiempo restante de la etapa.
 */
export function calcularProgresoEtapa(etapa: EtapaRutina, fecha: Date): ProgresoEtapa {
  const totalSeg = duracionEtapaSegundos(etapa.horaInicio, etapa.horaFin);
  if (totalSeg <= 0) {
    return {
      totalSeg: 1,
      transcurridoSeg: 0,
      restanteSeg: 0,
      porcentaje: 100,
      porcentajeRestante: 0,
      ratioRestante: 0,
      fase: "rojo",
    };
  }

  const minActual = dateAMinutos(fecha);
  const ini = horaAMinutos(etapa.horaInicio);

  let transcurridoMin = 0;
  if (minActual >= ini) {
    transcurridoMin = minActual - ini;
  } else {
    // Cruce de medianoche en madrugada
    transcurridoMin = 24 * 60 - ini + minActual;
  }

  const transcurridoSegContinuo = Math.max(0, Math.min(totalSeg, transcurridoMin * 60));
  const restanteSegContinuo = Math.max(0, totalSeg - transcurridoSegContinuo);

  const ratioRestante = Math.max(0, Math.min(1, restanteSegContinuo / totalSeg));
  const porcentajeRestante = ratioRestante * 100;
  const porcentaje = Math.min(100, Math.max(0, Math.round((1 - ratioRestante) * 100)));

  let fase: "verde" | "ambar" | "rojo" = "verde";
  if (porcentajeRestante <= 20) {
    fase = "rojo";
  } else if (porcentajeRestante <= 50) {
    fase = "ambar";
  }

  return {
    totalSeg,
    transcurridoSeg: Math.floor(transcurridoSegContinuo),
    restanteSeg: Math.ceil(restanteSegContinuo),
    porcentaje,
    porcentajeRestante,
    ratioRestante,
    fase,
  };
}

/**
 * Pospone la rutina del día a partir de una hora dada (o de la etapa actual),
 * desplazando hacia adelante los horarios de inicio y fin de todas las etapas posteriores.
 */
export function posponerRutina(
  etapas: EtapaRutina[],
  minutosShift: number,
  desdeHoraStr: string
): EtapaRutina[] {
  if (minutosShift === 0) return etapas;

  const minDesde = horaAMinutos(desdeHoraStr);

  return etapas.map((e) => {
    const ini = horaAMinutos(e.horaInicio);
    // Si la etapa inicia después o en la hora de corte
    if (ini >= minDesde) {
      const nuevoIniMin = ini + minutosShift;
      const nuevoFinMin = horaAMinutos(e.horaFin) + minutosShift;
      const nuevaHoraInicio = minutosAHora(nuevoIniMin);
      const nuevaHoraFin = minutosAHora(nuevoFinMin);
      const duracionMin = Math.round(duracionEtapaSegundos(nuevaHoraInicio, nuevaHoraFin) / 60);

      return {
        ...e,
        horaInicio: nuevaHoraInicio,
        horaFin: nuevaHoraFin,
        duracionMin: Math.max(1, duracionMin),
      };
    }
    // Si la etapa ya está en curso (ini < minDesde y fin > minDesde), extendemos su horaFin
    const fin = horaAMinutos(e.horaFin);
    if (ini < minDesde && fin > minDesde) {
      const nuevoFinMin = fin + minutosShift;
      const nuevaHoraFin = minutosAHora(nuevoFinMin);
      const duracionMin = Math.round(duracionEtapaSegundos(e.horaInicio, nuevaHoraFin) / 60);
      return {
        ...e,
        horaFin: nuevaHoraFin,
        duracionMin: Math.max(1, duracionMin),
      };
    }

    return e;
  });
}

/**
 * Pospone una etapa específica y todas las posteriores del día en cascada.
 * Si extenderPrevia es true, la etapa inmediatamente anterior extiende su horaFin
 * para que no quede un hueco vacío mientras transcurre la prórroga.
 */
export function posponerDesdeEtapa(
  etapas: EtapaRutina[],
  etapaId: string,
  minutosShift: number,
  extenderPrevia: boolean = true
): EtapaRutina[] {
  if (minutosShift === 0) return etapas;
  const idx = etapas.findIndex((e) => e.id === etapaId);
  if (idx === -1) return etapas;

  return etapas.map((e, i) => {
    // Si es la etapa inmediatamente anterior y se pidió extenderla
    if (extenderPrevia && i === idx - 1) {
      const nuevoFinMin = horaAMinutos(e.horaFin) + minutosShift;
      const nuevaHoraFin = minutosAHora(nuevoFinMin);
      const duracion = Math.round(duracionEtapaSegundos(e.horaInicio, nuevaHoraFin) / 60);
      return {
        ...e,
        horaFin: nuevaHoraFin,
        duracionMin: Math.max(1, duracion),
      };
    }
    // Si es la etapa seleccionada o posterior: desplazamos inicio y fin
    if (i >= idx) {
      const nuevoIniMin = horaAMinutos(e.horaInicio) + minutosShift;
      const nuevoFinMin = horaAMinutos(e.horaFin) + minutosShift;
      const nuevaHoraInicio = minutosAHora(nuevoIniMin);
      const nuevaHoraFin = minutosAHora(nuevoFinMin);
      const duracion = Math.round(duracionEtapaSegundos(nuevaHoraInicio, nuevaHoraFin) / 60);
      return {
        ...e,
        horaInicio: nuevaHoraInicio,
        horaFin: nuevaHoraFin,
        duracionMin: Math.max(1, duracion),
      };
    }
    return e;
  });
}

/**
 * Extiende la duración de la etapa activa actual en N minutos y traslada en cascada
 * el horario de todas las etapas posteriores del día.
 */
export function extenderEtapaActiva(
  etapas: EtapaRutina[],
  etapaId: string,
  minutosAdd: number
): EtapaRutina[] {
  if (minutosAdd === 0) return etapas;
  const idx = etapas.findIndex((e) => e.id === etapaId);
  if (idx === -1) return etapas;

  return etapas.map((e, i) => {
    if (i === idx) {
      const nuevoFinMin = horaAMinutos(e.horaFin) + minutosAdd;
      const nuevaHoraFin = minutosAHora(nuevoFinMin);
      const duracion = Math.round(duracionEtapaSegundos(e.horaInicio, nuevaHoraFin) / 60);
      return {
        ...e,
        horaFin: nuevaHoraFin,
        duracionMin: Math.max(1, duracion),
      };
    }
    if (i > idx) {
      const nuevoIniMin = horaAMinutos(e.horaInicio) + minutosAdd;
      const nuevoFinMin = horaAMinutos(e.horaFin) + minutosAdd;
      const nuevaHoraInicio = minutosAHora(nuevoIniMin);
      const nuevaHoraFin = minutosAHora(nuevoFinMin);
      const duracion = Math.round(duracionEtapaSegundos(nuevaHoraInicio, nuevaHoraFin) / 60);
      return {
        ...e,
        horaInicio: nuevaHoraInicio,
        horaFin: nuevaHoraFin,
        duracionMin: Math.max(1, duracion),
      };
    }
    return e;
  });
}

export interface TermometroEjecucion {
  /** Etapas que ya terminaron (o están completadas) hasta la hora actual. */
  esperadasTotal: number;
  completadasEsperadas: number;
  totalCompletadas: number;
  /** Minutos de rutina transcurridos desde el inicio del día hasta ahora. */
  minutosEsperados: number;
  /** De esos minutos, cuántos corresponden a etapas marcadas como cumplidas. */
  minutosCompletados: number;
  porcentajeRitmo: number; // 0 a 100
  estado: "impecable" | "bueno" | "demorado" | "por_comenzar";
  mensaje: string;
}

/** Fin de una etapa dentro del mismo día (una etapa que cruza medianoche termina a las 24:00). */
function finEnElDia(e: EtapaRutina): number {
  const ini = horaAMinutos(e.horaInicio);
  const fin = horaAMinutos(e.horaFin);
  return fin > ini ? fin : 1440;
}

/**
 * Termómetro de ejecución: compara lo cumplido contra lo que el horario exigía
 * desde que inició el día hasta la hora actual. El avance se pondera por minutos
 * de rutina, de modo que un atraso parcial da un porcentaje parcial (no cero) y
 * la etapa en curso no cuenta como atrasada: solo suma si ya fue marcada.
 */
export function calcularTermometroEjecucion(
  etapas: EtapaRutina[],
  completadasIds: Set<string>,
  fechaActual: Date
): TermometroEjecucion {
  const etapasHoy = filtrarEtapasPorDia(etapas, fechaActual);
  const base = {
    esperadasTotal: 0,
    completadasEsperadas: 0,
    totalCompletadas: completadasIds.size,
    minutosEsperados: 0,
    minutosCompletados: 0,
    porcentajeRitmo: 100,
  };
  if (!etapasHoy.length) {
    return { ...base, estado: "por_comenzar", mensaje: "Sin etapas programadas para hoy." };
  }

  const minActual = dateAMinutos(fechaActual);
  const inicioDia = Math.min(...etapasHoy.map((e) => horaAMinutos(e.horaInicio)));

  if (minActual < inicioDia) {
    return {
      ...base,
      estado: "por_comenzar",
      mensaje: `Listos para comenzar a las ${minutosAHora(inicioDia)}.`,
    };
  }

  let minutosEsperados = 0;
  let minutosCompletados = 0;
  let esperadasTotal = 0;
  let completadasEsperadas = 0;
  let pendientesTerminadas = 0;

  for (const e of etapasHoy) {
    const ini = horaAMinutos(e.horaInicio);
    const fin = finEnElDia(e);
    const transcurrido = Math.max(0, Math.min(fin, minActual) - ini);
    if (transcurrido <= 0) continue;

    const terminada = minActual >= fin;
    const completada = completadasIds.has(e.id);
    // La etapa en curso solo se cuenta si ya fue marcada como cumplida
    if (!terminada && !completada) continue;

    esperadasTotal += 1;
    minutosEsperados += transcurrido;
    if (completada) {
      completadasEsperadas += 1;
      minutosCompletados += transcurrido;
    } else {
      pendientesTerminadas += 1;
    }
  }

  if (esperadasTotal === 0) {
    return {
      ...base,
      estado: "impecable",
      mensaje: "¡Ritmo al día! Primera etapa en curso.",
    };
  }

  const porcentajeRitmo = Math.min(
    100,
    Math.round((minutosCompletados / minutosEsperados) * 100)
  );

  let estado: TermometroEjecucion["estado"];
  let mensaje: string;
  if (pendientesTerminadas === 0) {
    estado = "impecable";
    mensaje = `¡Ritmo impecable! Todo lo previsto hasta ahora está cumplido (${esperadasTotal} etapas).`;
  } else if (porcentajeRitmo >= 70) {
    estado = "bueno";
    mensaje = `Buen ritmo: ${pendientesTerminadas} ${
      pendientesTerminadas === 1 ? "etapa pendiente" : "etapas pendientes"
    } de las que ya pasaron.`;
  } else {
    estado = "demorado";
    mensaje = `Con demora: ${pendientesTerminadas} ${
      pendientesTerminadas === 1 ? "etapa pendiente" : "etapas pendientes"
    } de las que ya pasaron. Marcalas o pospone el día para sincronizar.`;
  }

  return {
    esperadasTotal,
    completadasEsperadas,
    totalCompletadas: completadasIds.size,
    minutosEsperados,
    minutosCompletados,
    porcentajeRitmo,
    estado,
    mensaje,
  };
}

function reprogramar(e: EtapaRutina, iniMin: number, finMin: number): EtapaRutina {
  const horaInicio = minutosAHora(iniMin);
  const horaFin = minutosAHora(finMin);
  const duracionMin = Math.round(duracionEtapaSegundos(horaInicio, horaFin) / 60);
  return { ...e, horaInicio, horaFin, duracionMin: Math.max(1, duracionMin) };
}

function desplazar(e: EtapaRutina, delta: number): EtapaRutina {
  return reprogramar(e, horaAMinutos(e.horaInicio) + delta, horaAMinutos(e.horaFin) + delta);
}

/**
 * Etapa que precede a la actual dentro de la rutina de hoy (null si la actual es la primera).
 */
export function obtenerEtapaAnterior(
  etapas: EtapaRutina[],
  fecha: Date
): EtapaRutina | null {
  const hoy = filtrarEtapasPorDia(etapas, fecha);
  const { index } = obtenerEtapaActual(etapas, fecha);
  return index > 0 ? hoy[index - 1] : null;
}

/**
 * Etapa que sigue a la actual dentro de la rutina de hoy (null si la actual es la última).
 */
export function obtenerEtapaSiguiente(
  etapas: EtapaRutina[],
  fecha: Date
): EtapaRutina | null {
  const hoy = filtrarEtapasPorDia(etapas, fecha);
  const { index } = obtenerEtapaActual(etapas, fecha);
  return index >= 0 && index < hoy.length - 1 ? hoy[index + 1] : null;
}

/**
 * Pasa a la etapa siguiente ahora mismo: la actual termina en este minuto y
 * el resto del día se adelanta lo que sobraba de ella. Sin cambios si no hay siguiente.
 */
export function avanzarEtapaAhora(etapas: EtapaRutina[], fecha: Date): EtapaRutina[] {
  const hoy = filtrarEtapasPorDia(etapas, fecha);
  const { etapa, index } = obtenerEtapaActual(etapas, fecha);
  if (!etapa || index < 0 || index >= hoy.length - 1) return etapas;

  const ini = horaAMinutos(etapa.horaInicio);
  const fin = finEnElDia(etapa);
  const nuevoFin = Math.max(ini + 1, Math.floor(dateAMinutos(fecha)));
  const delta = nuevoFin - fin;
  if (delta >= 0) return etapas;

  const posteriores = new Set(hoy.slice(index + 1).map((e) => e.id));
  return etapas.map((e) => {
    if (e.id === etapa.id) return reprogramar(e, ini, nuevoFin);
    if (posteriores.has(e.id)) return desplazar(e, delta);
    return e;
  });
}

/** Tiempo máximo que se le devuelve a una etapa al volver a ella (se ajusta luego con +5 min). */
export const RETOMAR_ETAPA_MAX_MIN = 15;

/**
 * Vuelve a la etapa anterior: se retoma ahora por su duración original (hasta
 * RETOMAR_ETAPA_MAX_MIN) y la etapa actual y las siguientes se corren hacia adelante lo
 * necesario. Sin cambios si la actual es la primera del día.
 */
export function retrocederEtapaAhora(etapas: EtapaRutina[], fecha: Date): EtapaRutina[] {
  const hoy = filtrarEtapasPorDia(etapas, fecha);
  const { etapa, index } = obtenerEtapaActual(etapas, fecha);
  if (!etapa || index < 1) return etapas;

  const previa = hoy[index - 1];
  const ahora = Math.floor(dateAMinutos(fecha));
  const nuevoFinPrevia = ahora + Math.min(previa.duracionMin, RETOMAR_ETAPA_MAX_MIN);
  const delta = nuevoFinPrevia - horaAMinutos(etapa.horaInicio);
  if (delta <= 0) return etapas;

  const desdeActual = new Set(hoy.slice(index).map((e) => e.id));
  return etapas.map((e) => {
    if (e.id === previa.id) return reprogramar(e, ahora, nuevoFinPrevia);
    if (desdeActual.has(e.id)) return desplazar(e, delta);
    return e;
  });
}

/**
 * Formatea segundos a "MM:SS" o "HH:MM:SS" si es mayor o igual a 1 hora.
 */
export function formatearSegundos(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const horas = Math.floor(s / 3600);
  const minutos = Math.floor((s % 3600) / 60);
  const segs = s % 60;

  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, "0")}:${String(segs).padStart(2, "0")}`;
  }
  return `${String(minutos).padStart(2, "0")}:${String(segs).padStart(2, "0")}`;
}

/**
 * Formato amigable en español (ej. "45 min", "1 h 15 min", "20 s").
 */
export function formatearTiempoHumano(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const horas = Math.floor(s / 3600);
  const minutos = Math.floor((s % 3600) / 60);

  if (horas > 0 && minutos > 0) {
    return `${horas} h ${minutos} min`;
  }
  if (horas > 0) {
    return `${horas} h`;
  }
  if (minutos > 0) {
    return `${minutos} min`;
  }
  return `${s} seg`;
}
