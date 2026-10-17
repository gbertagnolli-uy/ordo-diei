// Propio de Ordo (lane 181, V1): textos de la pantalla «Hoy» del hijo. Puros, para probarlos sin pantalla.

/** «Buenos días / Buenas tardes / Buenas noches» según la hora local (0–23) */
export function saludoDe(hora: number): string {
  if (hora >= 5 && hora < 13) return "Buenos días";
  if (hora >= 13 && hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

export interface EstadoDia {
  total: number;
  hechos: number;
}

/** Texto de ánimo según cuánto lleva hecho el día */
export function mensajeDelDia({ total, hechos }: EstadoDia): string {
  if (total === 0) return "Hoy no hay clase. ¡Disfrutá el día!";
  if (hechos >= total) return "¡Terminaste todo por hoy!";
  if (hechos === 0) return total === 1 ? "Hoy tenés una cosa para hacer." : `Hoy tenés ${total} cosas para hacer.`;
  const faltan = total - hechos;
  return faltan === 1 ? "Ya casi: te falta una." : `Vas bien: te faltan ${faltan}.`;
}

/** Porcentaje 0–100 del día */
export const avanceDelDia = ({ total, hechos }: EstadoDia): number => (total <= 0 ? 0 : Math.min(100, Math.round((hechos / total) * 100)));

/** Minutos → «45 min» / «1 h 20 min» */
export function duracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
