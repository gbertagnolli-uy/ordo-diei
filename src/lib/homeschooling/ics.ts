// Propio de Ordo (lane 179, R4): arma un calendario iCalendar (.ics) para suscribirse desde Google Calendar o Apple Calendar.
// Puro: recibe eventos y devuelve texto (RFC 5545: líneas de CRLF, plegado a 75 octetos, escapes de `, ; \` y saltos).

export interface EventoIcs {
  uid: string;
  titulo: string;
  descripcion?: string | null;
  lugar?: string | null;
  /** Evento de día completo ('YYYY-MM-DD') */
  dia?: string;
  /** Evento con hora (instantes) */
  inicio?: Date;
  fin?: Date;
}

const escapar = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const soloDigitos = (clave: string) => clave.replace(/-/g, "");
const sumaDia = (clave: string) => new Date(Date.parse(`${clave}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

/** Pliega una línea a 75 octetos (UTF-8) sin cortar un carácter por la mitad */
export function plegar(linea: string): string {
  const enc = new TextEncoder();
  if (enc.encode(linea).length <= 75) return linea;
  const partes: string[] = [];
  let actual = "";
  let bytes = 0;
  for (const ch of linea) {
    const n = enc.encode(ch).length;
    const limite = partes.length === 0 ? 75 : 74; // las continuaciones llevan un espacio delante
    if (bytes + n > limite) {
      partes.push(actual);
      actual = "";
      bytes = 0;
    }
    actual += ch;
    bytes += n;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

export function construirIcs(nombre: string, eventos: EventoIcs[], ahora = new Date()): string {
  const lineas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ordo Diei//Estudio//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escapar(nombre)}`, "X-WR-TIMEZONE:America/Montevideo"];
  for (const e of eventos) {
    let fechas: string[];
    if (e.dia) fechas = [`DTSTART;VALUE=DATE:${soloDigitos(e.dia)}`, `DTEND;VALUE=DATE:${soloDigitos(sumaDia(e.dia))}`];
    else if (e.inicio) fechas = [`DTSTART:${utc(e.inicio)}`, `DTEND:${utc(e.fin ?? new Date(e.inicio.getTime() + 3_600_000))}`];
    else continue; // sin fecha no hay evento
    lineas.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${utc(ahora)}`, ...fechas, `SUMMARY:${escapar(e.titulo)}`);
    if (e.descripcion) lineas.push(`DESCRIPTION:${escapar(e.descripcion)}`);
    if (e.lugar) lineas.push(`LOCATION:${escapar(e.lugar)}`);
    lineas.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lineas.push("END:VCALENDAR");
  return lineas.map(plegar).join("\r\n") + "\r\n";
}
