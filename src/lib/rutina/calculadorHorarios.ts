import type { EtapaRutina, DiasAplicables } from "./tipos.ts";

/**
 * Convierte "HH:mm" a minutos desde medianoche (0 a 1439).
 */
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convierte un objeto Date a minutos del día según hora local.
 */
export function dateAMinutos(fecha: Date): number {
  return fecha.getHours() * 60 + fecha.getMinutes() + fecha.getSeconds() / 60;
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
    // Misma hora inicio y fin
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
  // Cruza medianoche: minutos hasta las 24:00 + minutos desde las 00:00
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

  // Buscar la primera etapa cuyo inicio sea estrictamente mayor a la hora actual
  for (let i = 0; i < etapasHoy.length; i++) {
    const e = etapasHoy[i];
    const ini = horaAMinutos(e.horaInicio);
    if (ini > minActual) {
      const restanteSeg = Math.round((ini - minActual) * 60);
      return { etapa: e, restanteSeg };
    }
  }

  // Si ya pasaron todas hoy, la próxima es la primera etapa del día de mañana
  const manana = new Date(fecha.getTime() + 24 * 3600 * 1000);
  const etapasManana = filtrarEtapasPorDia(etapas, manana);
  const primera = etapasManana[0] || etapasHoy[0];

  const iniManana = horaAMinutos(primera.horaInicio);
  const minutosHastaMedianoche = 24 * 60 - minActual;
  const restanteSeg = Math.round((minutosHastaMedianoche + iniManana) * 60);

  return { etapa: primera, restanteSeg };
}

export interface ProgresoEtapa {
  totalSeg: number;
  transcurridoSeg: number;
  restanteSeg: number;
  porcentaje: number; // 0 a 100 (% transcurrido)
  porcentajeRestante: number; // 100 a 0 (% que falta)
  fase: "verde" | "ambar" | "rojo"; // verde > 50%, ambar 20-50%, rojo < 20%
}

/**
 * Calcula con precisión de segundos el progreso y tiempo restante de la etapa actual.
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
      fase: "rojo",
    };
  }

  const minActual = dateAMinutos(fecha);
  const ini = horaAMinutos(etapa.horaInicio);

  let transcurridoMin = 0;
  if (minActual >= ini) {
    transcurridoMin = minActual - ini;
  } else {
    // Si la etapa cruzó medianoche y estamos en la madrugada
    transcurridoMin = 24 * 60 - ini + minActual;
  }

  const transcurridoSeg = Math.max(0, Math.min(totalSeg, Math.round(transcurridoMin * 60)));
  const restanteSeg = Math.max(0, totalSeg - transcurridoSeg);
  const porcentaje = Math.min(100, Math.max(0, Math.round((transcurridoSeg / totalSeg) * 100)));
  const porcentajeRestante = 100 - porcentaje;

  let fase: "verde" | "ambar" | "rojo" = "verde";
  if (porcentajeRestante <= 20) {
    fase = "rojo";
  } else if (porcentajeRestante <= 50) {
    fase = "ambar";
  }

  return {
    totalSeg,
    transcurridoSeg,
    restanteSeg,
    porcentaje,
    porcentajeRestante,
    fase,
  };
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
