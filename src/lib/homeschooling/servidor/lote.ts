// Propio de Ordo (lane 170, M3): vista previa de la carga masiva. Toma la lista pegada, detecta cada enlace y completa los
// títulos que faltan con el de la página (YouTube/Vimeo/Docs), de a 5 consultas a la vez y con tope de tiempo.
import { detectarMaterial, ETIQUETA_TIPO, type TipoMaterial } from "../material.ts";
import { parsearLista } from "../listaLecciones.ts";
import { obtenerTitulo } from "./titulos.ts";

export type LeccionPrevia = { titulo: string; url: string | null; tipo: TipoMaterial | null; etiqueta: string };

const SIMULTANEAS = 5;
const MAX_BUSQUEDAS = 40;

async function enTandas<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const salida: R[] = new Array(items.length);
  let siguiente = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (siguiente < items.length) {
        const i = siguiente++;
        salida[i] = await fn(items[i]);
      }
    })
  );
  return salida;
}

export async function vistaPreviaLote(texto: string, buscarTitulos = true): Promise<LeccionPrevia[]> {
  const lineas = parsearLista(texto);
  let busquedas = 0;
  return enTandas(lineas, SIMULTANEAS, async (l) => {
    if (!l.url) return { titulo: l.titulo, url: null, tipo: null, etiqueta: "Lección de texto" };
    const det = detectarMaterial(l.url);
    let titulo = l.titulo;
    if (!titulo) {
      titulo = det.titulo;
      if (buscarTitulos && busquedas++ < MAX_BUSQUEDAS) titulo = (await obtenerTitulo(det)) ?? titulo;
    }
    return { titulo: titulo || "Lección", url: det.url ?? l.url, tipo: det.tipo, etiqueta: ETIQUETA_TIPO[det.tipo] };
  });
}
