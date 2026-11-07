// Agenda semanal imprimible (lane 273, Plane #32): agrupa los eventos proyectados de UN usuario en los 7 días de la semana.
import type { EventoCalendarioProyectado } from "./proyeccionCalendario.ts";

export interface ItemAgenda {
  id: string;
  hora: string | null; // "HH:MM" en hora local; null = sin hora
  titulo: string;
  descripcion: string | null;
  duracionMin: number | null;
  checklist: string[];
  companeros: string[]; // los otros responsables, si la tarea es compartida
}

export interface DiaAgenda {
  fecha: Date;
  items: ItemAgenda[];
}

const dosDigitos = (n: number) => String(n).padStart(2, "0");

/** Lunes 00:00 (hora local) de la semana de `fecha`. */
export function lunesDe(fecha: Date): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
  const desdeLunes = (d.getDay() + 6) % 7; // domingo=6, lunes=0
  d.setDate(d.getDate() - desdeLunes);
  return d;
}

/** Domingo 23:59:59.999 (hora local) de la semana que empieza en `lunes`. */
export function domingoDe(lunes: Date): Date {
  return new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6, 23, 59, 59, 999);
}

function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function armarSemana(eventos: EventoCalendarioProyectado[], lunes: Date, usuarioId: number): DiaAgenda[] {
  const dias: DiaAgenda[] = Array.from({ length: 7 }, (_, i) => ({
    fecha: new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i),
    items: [],
  }));

  for (const ev of eventos) {
    const dia = dias.find((d) => mismoDia(d.fecha, ev.start));
    if (!dia) continue;
    const res = ev.resource ?? {};
    const seg = Number(res.tiempoEjecucionEstimadoSeg) || 0;
    const asignados: { id: number; nombre: string }[] = Array.isArray(res.asignados) ? res.asignados : [];
    const checklist: { texto: string }[] = Array.isArray(res.checklistItems) ? res.checklistItems : [];
    dia.items.push({
      id: String(ev.id),
      hora: ev.allDay ? null : `${dosDigitos(ev.start.getHours())}:${dosDigitos(ev.start.getMinutes())}`,
      titulo: String(ev.title ?? res.titulo ?? ""),
      descripcion: res.descripcion ? String(res.descripcion) : null,
      duracionMin: seg > 0 ? Math.round(seg / 60) : null,
      checklist: checklist.map((c) => String(c.texto)),
      companeros: asignados.filter((a) => Number(a.id) !== usuarioId).map((a) => a.nombre),
    });
  }

  // Con hora primero (de más temprano a más tarde); las «sin hora» al final, por título
  for (const dia of dias) {
    dia.items.sort((a, b) => {
      if (a.hora && b.hora) return a.hora.localeCompare(b.hora);
      if (a.hora) return -1;
      if (b.hora) return 1;
      return a.titulo.localeCompare(b.titulo, "es");
    });
  }
  return dias;
}
