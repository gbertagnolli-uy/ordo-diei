// Propio de Ordo (lane 182, K2): cuentas del boletín. Puro: los períodos por defecto, la asistencia y las horas.

export interface PeriodoBase {
  nombre: string;
  inicio: string;
  fin: string;
}

/** Tres trimestres del año escolar (marzo a diciembre, el calendario del Río de la Plata) */
export function trimestresDelAnio(anio: number): PeriodoBase[] {
  return [
    { nombre: `Primer trimestre ${anio}`, inicio: `${anio}-03-01`, fin: `${anio}-05-31` },
    { nombre: `Segundo trimestre ${anio}`, inicio: `${anio}-06-01`, fin: `${anio}-08-31` },
    { nombre: `Tercer trimestre ${anio}`, inicio: `${anio}-09-01`, fin: `${anio}-12-20` },
  ];
}

/** Asistencia en %: días con clase hecha sobre días con clase que ya pasaron. null si no hubo clases */
export function asistencia(diasConClase: number, diasHechos: number): number | null {
  if (diasConClase <= 0) return null;
  return Math.min(100, Math.round((diasHechos / diasConClase) * 100));
}

/** 135 → «2 h 15 min» */
export function horasTexto(minutos: number): string {
  if (minutos <= 0) return "0 h";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function validarPeriodo(p: PeriodoBase): string | null {
  if (!p.nombre.trim()) return "Falta el nombre del período";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(p.fin)) return "Fechas no válidas";
  if (p.inicio > p.fin) return "El inicio es posterior al fin";
  return null;
}

/** El período que contiene una fecha, o el más reciente que ya empezó */
export function periodoVigente<T extends PeriodoBase>(periodos: T[], hoy: string): T | null {
  const ordenados = [...periodos].sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
  const dentro = ordenados.find((p) => p.inicio <= hoy && hoy <= p.fin);
  if (dentro) return dentro;
  const pasados = ordenados.filter((p) => p.fin < hoy);
  return pasados.at(-1) ?? ordenados[0] ?? null;
}
