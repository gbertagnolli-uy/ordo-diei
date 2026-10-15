// Propio de Ordo (lane 187, S1b): búsqueda dentro de las listas de Estudio. Sin acentos ni mayúsculas, y cada palabra de lo que se
// escribe tiene que estar en alguno de los campos («fracc leo» encuentra «Fracciones» de «Leo»). Pura y rápida: filtra en el cliente.

export function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** ¿Todas las palabras de la consulta aparecen en el texto de los campos? Una consulta vacía coincide con todo. */
export function coincide(campos: (string | null | undefined)[], consulta: string): boolean {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const pajar = normalizar(campos.filter((c): c is string => !!c).join(" \n "));
  return palabras.every((p) => pajar.includes(p));
}

export function filtrar<T>(items: T[], consulta: string, campos: (x: T) => (string | null | undefined)[]): T[] {
  return consulta.trim() ? items.filter((x) => coincide(campos(x), consulta)) : items;
}
