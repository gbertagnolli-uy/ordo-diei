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
