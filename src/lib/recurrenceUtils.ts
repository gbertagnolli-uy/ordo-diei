/**
 * Utilidades para el cálculo de recurrencias "Ordo Diei".
 */

/**
 * Calcula la próxima fecha basada en un día del mes (1-31).
 * Si el mes tiene menos días que el objetivo, devuelve el último día del mes.
 */
export function getNextDateByDayOfMonth(targetDay: number, fromDate: Date = new Date()): Date {
  // Calculamos para el mes siguiente (o el actual si aún no ha pasado el día)
  let year = fromDate.getFullYear();
  let month = fromDate.getMonth();
  
  // Si ya pasamos el día objetivo este mes, ir al siguiente
  if (fromDate.getDate() >= targetDay) {
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  // Truco en JS: El día '0' del mes siguiente nos da el último día del mes actual
  const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();

  // El día final es el mínimo entre el deseado y el máximo del mes
  const finalDay = Math.min(targetDay, lastDayOfTargetMonth);

  const result = new Date(year, month, finalDay);
  // Mantener la hora del original si es necesario, pero aquí solo calculamos la fecha
  return result;
}

/**
 * Calcula la próxima fecha basada en "El [ordinal] [Día] del mes"
 * @param ordinal 1 (Primer), 2 (Segundo), 3, 4, -1 (Último)
 * @param targetDayOfWeek 0 (Dom) a 6 (Sab)
 */
export function getNextDateByNthWeekday(ordinal: number, targetDayOfWeek: number, fromDate: Date = new Date()): Date {
  let year = fromDate.getFullYear();
  let month = fromDate.getMonth();
  
  // Función interna para encontrar la fecha en un mes específico
  const findInMonth = (y: number, m: number) => {
    if (ordinal === -1) {
      // ÚLTIMO [Día]
      const date = new Date(y, m + 1, 0);
      while (date.getDay() !== targetDayOfWeek) {
        date.setDate(date.getDate() - 1);
      }
      return date;
    } else {
      // N-ésimo [Día]
      const date = new Date(y, m, 1);
      let count = 0;
      while (date.getMonth() === m) {
        if (date.getDay() === targetDayOfWeek) {
          count++;
          if (count === ordinal) return date;
        }
        date.setDate(date.getDate() + 1);
      }
      return null;
    }
  };

  // Intentar este mes
  let targetDate = findInMonth(year, month);
  
  // Si ya pasó o no existe en este mes, intentar el siguiente
  if (!targetDate || targetDate <= fromDate) {
    month++;
    if (month > 11) { month = 0; year++; }
    targetDate = findInMonth(year, month);
  }
  
  if (!targetDate) throw new Error("No se pudo calcular la fecha de recurrencia");
  
  return targetDate;
}

/**
 * Función principal para obtener la próxima fecha de vencimiento
 */
export function calculateNextOccurrence(tarea: {
  tipoRecurrencia: string;
  fechaVencimiento: Date | null;
  diaDelMes?: number | null;
  ordinalSemana?: number | null;
  diaDeLaSemana?: number | null;
}, fromDate: Date = new Date()): Date | null {
  const current = tarea.fechaVencimiento || fromDate;
  
  switch (tarea.tipoRecurrencia) {
    case "Diaria": {
      const next = new Date(current);
      next.setDate(next.getDate() + 1);
      return next;
    }
    case "Semanal": {
      const next = new Date(current);
      // Si tenemos un dia de la semana específico (0-6)
      if (tarea.diaDeLaSemana !== undefined && tarea.diaDeLaSemana !== null) {
        next.setDate(next.getDate() + 1);
        while (next.getDay() !== tarea.diaDeLaSemana) {
          next.setDate(next.getDate() + 1);
        }
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    }
    case "Mensual_Fecha": {
      if (!tarea.diaDelMes) return null;
      return getNextDateByDayOfMonth(tarea.diaDelMes, current);
    }
    case "Mensual_Ordinal": {
      if (tarea.ordinalSemana === null || tarea.diaDeLaSemana === null || 
          tarea.ordinalSemana === undefined || tarea.diaDeLaSemana === undefined) return null;
      return getNextDateByNthWeekday(tarea.ordinalSemana, tarea.diaDeLaSemana, current);
    }
    default:
      return null;
  }
}

/**
 * ¿Le toca a la regla generar una instancia en `dia`?
 * Solo mira el patrón y el ancla (la fecha de la regla), nunca el reloj ni el estado.
 * Mensual_Fecha: si el mes no tiene ese día, cae en el último día del mes.
 */
export function ocurreEn(regla: {
  tipoRecurrencia: string;
  fechaVencimiento: Date | null;
  diaDelMes?: number | null;
  ordinalSemana?: number | null;
  diaDeLaSemana?: number | null;
  intervalo?: number | null;
  anclaFecha?: Date | null;
}, dia: Date): boolean {
  const ancla = regla.fechaVencimiento;
  if (!patronCoincide(regla, dia, ancla)) return false;
  const n = regla.intervalo ?? 1;
  if (n <= 1) return true;
  const base = regla.anclaFecha ?? ancla;
  if (!base) return true;
  if (regla.tipoRecurrencia === "Diaria") return diasEntre(base, dia) % n === 0;
  if (regla.tipoRecurrencia === "Semanal") return Math.floor(diasEntre(base, dia) / 7) % n === 0;
  return mesesEntre(base, dia) % n === 0;
}

function diasEntre(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

function mesesEntre(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

/**
 * Anclaje al completado: la siguiente toca `intervalo` días/semanas/meses después
 * de la última vez que el usuario completó (o de la fecha inicial si nunca lo hizo).
 * El reloj no mueve el ancla; si el mes destino es más corto, cae a su último día.
 */
export function tocaPorCompletado(regla: {
  tipoRecurrencia: string;
  intervalo?: number | null;
  anclaFecha?: Date | null;
  fechaVencimiento: Date | null;
}, dia: Date): boolean {
  const base = regla.anclaFecha ?? regla.fechaVencimiento;
  if (!base) return false;
  const n = Math.max(1, regla.intervalo ?? 1);
  let objetivo: Date;
  if (regla.tipoRecurrencia === "Diaria") {
    objetivo = new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
  } else if (regla.tipoRecurrencia === "Semanal") {
    objetivo = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7 * n);
  } else {
    const ultimo = new Date(base.getFullYear(), base.getMonth() + n + 1, 0).getDate();
    objetivo = new Date(base.getFullYear(), base.getMonth() + n, Math.min(base.getDate(), ultimo));
  }
  return diasEntre(objetivo, dia) >= 0;
}

function patronCoincide(regla: {
  tipoRecurrencia: string;
  diaDelMes?: number | null;
  ordinalSemana?: number | null;
  diaDeLaSemana?: number | null;
}, dia: Date, ancla: Date | null): boolean {
  switch (regla.tipoRecurrencia) {
    case "Diaria":
      return true;
    case "Semanal": {
      const objetivo = regla.diaDeLaSemana ?? ancla?.getDay();
      return objetivo === undefined || objetivo === null ? true : dia.getDay() === objetivo;
    }
    case "Mensual_Fecha": {
      const objetivo = regla.diaDelMes ?? ancla?.getDate();
      if (!objetivo) return false;
      const ultimo = new Date(dia.getFullYear(), dia.getMonth() + 1, 0).getDate();
      return dia.getDate() === Math.min(objetivo, ultimo);
    }
    case "Mensual_Ordinal": {
      if (regla.ordinalSemana == null || regla.diaDeLaSemana == null) return false;
      if (dia.getDay() !== regla.diaDeLaSemana) return false;
      if (regla.ordinalSemana === -1) {
        const ultimo = new Date(dia.getFullYear(), dia.getMonth() + 1, 0).getDate();
        return dia.getDate() + 7 > ultimo;
      }
      return Math.ceil(dia.getDate() / 7) === regla.ordinalSemana;
    }
    default:
      return false;
  }
}
