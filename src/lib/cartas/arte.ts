// Arte de las cartas (D19, sin spoilers). Los archivos del catálogo viven en `arte-cartas/` (fuera de `public/`)
// y se sirven solo por /api/cartas/arte, que verifica el grado del usuario. En la base las rutas siguen siendo
// lógicas: "/cartas/<clave>/<N>.webp". Las subidas por el panel ("/uploads/<uuid>_…") tienen nombre no adivinable.
import { gradoDe, imagenDeGrado, type CartaConImagenes } from "./fragmentos.ts";

const PREFIJO_CATALOGO = "/cartas/";

/** URL que usa el navegador para una ruta lógica de arte */
export function urlArte(ruta: string | null | undefined): string {
  if (!ruta) return "";
  return ruta.startsWith(PREFIJO_CATALOGO) ? `/api/cartas/arte?ruta=${encodeURIComponent(ruta)}` : ruta;
}

/** Ruta en disco (relativa a la raíz del proyecto) de una ruta lógica, o null si no es válida */
export function rutaEnDiscoArte(ruta: string): string | null {
  const m = /^\/cartas\/([a-z0-9-]+)\/([a-zA-Z0-9_-]+\.(?:webp|png|jpe?g))$/.exec(ruta);
  if (m) return `arte-cartas/${m[1]}/${m[2]}`;
  const u = /^\/uploads\/([\w.-]+)$/.exec(ruta);
  if (u && !u[1].includes("..")) return `public/uploads/${u[1]}`;
  return null;
}

/**
 * Grado pedido en la URL: entero de 0 a 4. Cualquier otra cosa es inválida (null);
 * antes, "?grado=abc" daba NaN, pasaba el control y devolvía la imagen del grado IV.
 */
export function parsearGrado(valor: string | null): 0 | 1 | 2 | 3 | 4 | null {
  if (valor === null) return 1;
  if (!/^[0-4]$/.test(valor)) return null;
  return Number(valor) as 0 | 1 | 2 | 3 | 4;
}

/**
 * La única ruta de arte que puede ver un usuario sin permisos de administración:
 * la de su grado actual (grado I, en blanco y negro, si todavía no la desbloqueó).
 */
export function rutaPermitida(carta: CartaConImagenes & { fragmentosRequeridos: number }, fragmentos: number) {
  return imagenDeGrado(carta, Math.max(1, gradoDe(fragmentos, carta.fragmentosRequeridos)) as 1 | 2 | 3 | 4);
}
