// Propio de Ordo (lane 193, K3): armado del portafolio imprimible. Puro: filtra por fechas, ordena cronológicamente y calcula
// el título del rango, para probarlo sin base ni pantalla.
export interface EvidenciaImpresa {
  id: number;
  created_at: string;
  status: string;
}

/** 'YYYY-MM-DD' (o null) de un instante ISO, en UTC */
const dia = (iso: string) => iso.slice(0, 10);

export function filtrarPorFechas<T extends EvidenciaImpresa>(items: T[], desde: string | null, hasta: string | null, soloAprobadas = true): T[] {
  return items
    .filter((e) => (!soloAprobadas || e.status === "aprobada") && (!desde || dia(e.created_at) >= desde) && (!hasta || dia(e.created_at) <= hasta))
    .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id - b.id));
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fechaLarga = (c: string) => `${Number(c.slice(8))} de ${MESES[Number(c.slice(5, 7)) - 1]} de ${c.slice(0, 4)}`;

/** «del 1 de marzo al 31 de mayo de 2026» · «hasta el …» · «desde el …» · «todo el año» */
export function tituloDeRango(desde: string | null, hasta: string | null): string {
  if (desde && hasta) return `del ${fechaLarga(desde).replace(/ de \d{4}$/, desde.slice(0, 4) === hasta.slice(0, 4) ? "" : ` de ${desde.slice(0, 4)}`)} al ${fechaLarga(hasta)}`;
  if (desde) return `desde el ${fechaLarga(desde)}`;
  if (hasta) return `hasta el ${fechaLarga(hasta)}`;
  return "todos los trabajos";
}
