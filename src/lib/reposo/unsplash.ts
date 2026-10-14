// Pool de fotos de Unsplash para la pantalla de reposo (SPEC idle-marco-fotos §5).
// Cliente de la API con `fetch` inyectable y la lógica del pool sobre una interfaz de repositorio:
// los tests no tocan la red ni la base.
//
// Reglas de la API (SPEC §5.1): hotlinking (se muestran las URLs de images.unsplash.com con
// parámetros de tamaño; no se re-sirven), registrar la descarga UNA vez por foto al entrar al pool,
// atribución con UTM, Access Key solo en el servidor, 50 pedidos/hora en modo demo.

export const API_UNSPLASH = "https://api.unsplash.com";
export const UTM = "utm_source=ordo_diei&utm_medium=referral";
/** Tema oficial «Nature» de Unsplash. */
export const TEMA_NATURE = "6sMVjTLSkeQ";
/** Margen bajo el tope de 50 pedidos/hora: 2 de listado + descargas, sin agotar la cuota. */
export const MAX_PEDIDOS_POR_CORRIDA = 46;
export const CANTIDAD_HORIZONTAL = 30;
export const CANTIDAD_VERTICAL = 10;

export type Orientacion = "horizontal" | "vertical";

/** Lo que usamos de la respuesta de `GET /photos/random`. */
export type FotoApi = {
  id: string;
  width: number;
  height: number;
  color?: string | null;
  blur_hash?: string | null;
  urls: { raw: string };
  links: { html: string; download_location?: string };
  user: { name: string; username: string };
};

export type FotoPool = {
  id: string;
  urlRaw: string;
  ancho: number;
  alto: number;
  color: string | null;
  blurHash: string | null;
  autorNombre: string;
  autorUsuario: string;
  urlFoto: string;
  orientacion: Orientacion;
  activa: boolean;
  oculta: boolean;
  descargaAvisada: boolean;
  createdAt: Date;
};

export type ConfigReposo = {
  segundosLogin: number;
  segundosSesion: number;
  unsplashTema: string;
  unsplashConsulta: string | null;
  tamPool: number;
  mostrarRefCatecismo: boolean;
  ultimaSincronia: Date | null;
};

export const CONFIG_POR_DEFECTO: ConfigReposo = {
  segundosLogin: 15,
  segundosSesion: 60,
  unsplashTema: TEMA_NATURE,
  unsplashConsulta: null,
  tamPool: 150,
  mostrarRefCatecismo: true,
  ultimaSincronia: null,
};

export interface RepoReposo {
  /** La fila única de configuración (la crea con los valores por defecto si no existe). */
  config(): Promise<ConfigReposo>;
  guardarConfig(cambios: Partial<ConfigReposo>): Promise<ConfigReposo>;
  /** Ids ya presentes (incluye ocultas y desactivadas: una foto quitada no vuelve a entrar). */
  idsExistentes(): Promise<Set<string>>;
  crearFotos(fotos: FotoPool[]): Promise<void>;
  /** Fotos con la descarga sin avisar (reintento de corridas anteriores). */
  pendientesDeAviso(): Promise<string[]>;
  marcarAvisada(id: string): Promise<void>;
  /** Activas y no ocultas, de la más vieja a la más nueva. */
  activasPorAntiguedad(): Promise<{ id: string }[]>;
  desactivar(ids: string[]): Promise<void>;
}

export type DepsUnsplash = {
  fetch: typeof fetch;
  accessKey: string | undefined;
  log?: (mensaje: string) => void;
};

export type ResultadoRefresco =
  | { ok: true; nuevas: number; avisadas: number; desactivadas: number; activas: number; pedidos: number }
  | { ok: false; motivo: string };

const cabeceras = (key: string) => ({ Authorization: `Client-ID ${key}`, "Accept-Version": "v1" });

export function orientacionDe(f: Pick<FotoApi, "width" | "height">): Orientacion {
  return f.height > f.width ? "vertical" : "horizontal";
}

export function aFotoPool(f: FotoApi, ahora: Date = new Date()): FotoPool {
  return {
    id: f.id,
    urlRaw: f.urls.raw,
    ancho: f.width,
    alto: f.height,
    color: f.color ?? null,
    blurHash: f.blur_hash ?? null,
    autorNombre: f.user.name,
    autorUsuario: f.user.username,
    urlFoto: f.links.html,
    orientacion: orientacionDe(f),
    activa: true,
    oculta: false,
    descargaAvisada: false,
    createdAt: ahora,
  };
}

export class ErrorUnsplash extends Error {
  status?: number;
  constructor(mensaje: string, status?: number) {
    super(mensaje);
    this.status = status;
  }
}

/** `GET /photos/random` (con `count` devuelve un arreglo). */
export async function pedirAleatorias(
  deps: DepsUnsplash,
  opciones: { orientacion: "landscape" | "portrait"; count: number; tema: string; consulta: string | null },
): Promise<FotoApi[]> {
  if (!deps.accessKey) throw new ErrorUnsplash("Falta UNSPLASH_ACCESS_KEY");
  const p = new URLSearchParams({
    orientation: opciones.orientacion,
    content_filter: "high",
    count: String(opciones.count),
  });
  // Una consulta propia del padre reemplaza al tema (SPEC §5.2)
  if (opciones.consulta?.trim()) p.set("query", opciones.consulta.trim());
  else p.set("topics", opciones.tema);
  const res = await deps.fetch(`${API_UNSPLASH}/photos/random?${p}`, { headers: cabeceras(deps.accessKey) });
  if (!res.ok) throw new ErrorUnsplash(`Unsplash respondió ${res.status}`, res.status);
  const cuerpo = await res.json();
  return Array.isArray(cuerpo) ? (cuerpo as FotoApi[]) : [cuerpo as FotoApi];
}

/** Avisa la descarga (regla 2 de §5.1). `links.download_location` equivale a `/photos/{id}/download`. */
export async function avisarDescarga(deps: DepsUnsplash, id: string): Promise<boolean> {
  if (!deps.accessKey) return false;
  const res = await deps.fetch(`${API_UNSPLASH}/photos/${encodeURIComponent(id)}/download`, { headers: cabeceras(deps.accessKey) });
  return res.ok;
}

/**
 * Refresca el pool (lo llama el cron diario y el botón «Cargar fotos ahora»). Un fallo de Unsplash
 * no rompe nada: se devuelve `ok:false` y el pool queda como estaba (SPEC §5.2).
 */
export async function refrescarPoolUnsplash(repo: RepoReposo, deps: DepsUnsplash, ahora: Date = new Date()): Promise<ResultadoRefresco> {
  const log = deps.log ?? (() => {});
  if (!deps.accessKey) return { ok: false, motivo: "Falta UNSPLASH_ACCESS_KEY" };
  let pedidos = 0;
  try {
    const config = await repo.config();
    const existentes = await repo.idsExistentes();

    const nuevas: FotoPool[] = [];
    for (const [orientacion, count] of [["landscape", CANTIDAD_HORIZONTAL], ["portrait", CANTIDAD_VERTICAL]] as const) {
      pedidos++;
      const fotos = await pedirAleatorias(deps, { orientacion, count, tema: config.unsplashTema, consulta: config.unsplashConsulta });
      for (const f of fotos) {
        // `random` puede repetir fotos (entre pedidos y con el pool): cada id entra una sola vez
        if (existentes.has(f.id)) continue;
        existentes.add(f.id);
        nuevas.push(aFotoPool(f, ahora));
      }
    }
    if (nuevas.length) await repo.crearFotos(nuevas);

    // Avisos de descarga: las nuevas y las que quedaron pendientes de corridas anteriores
    let avisadas = 0;
    const pendientes = await repo.pendientesDeAviso();
    for (const id of pendientes) {
      if (pedidos >= MAX_PEDIDOS_POR_CORRIDA) {
        log(`[Unsplash] tope de pedidos alcanzado; quedan avisos para la próxima corrida`);
        break;
      }
      pedidos++;
      try {
        if (await avisarDescarga(deps, id)) {
          await repo.marcarAvisada(id);
          avisadas++;
        }
      } catch (e) {
        log(`[Unsplash] no se pudo avisar la descarga de ${id}: ${(e as Error).message}`);
      }
    }

    // Mantener el pool en `tamPool`: se desactivan las más viejas
    const activas = await repo.activasPorAntiguedad();
    let desactivadas = 0;
    if (activas.length > config.tamPool) {
      const sobran = activas.slice(0, activas.length - config.tamPool).map((f) => f.id);
      await repo.desactivar(sobran);
      desactivadas = sobran.length;
    }
    await repo.guardarConfig({ ultimaSincronia: ahora });
    return { ok: true, nuevas: nuevas.length, avisadas, desactivadas, activas: activas.length - desactivadas, pedidos };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "Error desconocido";
    log(`[Unsplash] refresco fallido: ${motivo}`);
    return { ok: false, motivo };
  }
}

// ---------------------------------------------------------------- lectura pública

export type FotoPublica = {
  id: string;
  /** URL de images.unsplash.com con parámetros de tamaño (hotlinking). */
  url: string;
  ancho: number;
  alto: number;
  color: string | null;
  blurHash: string | null;
  autor: string;
  /** Perfil del autor, con UTM. */
  urlAutor: string;
  /** Página de la foto en Unsplash, con UTM. */
  urlFoto: string;
  /** Página de Unsplash, con UTM (para «en Unsplash»). */
  urlUnsplash: string;
};

/** Agrega parámetros de tamaño a la URL cruda sin perder los que ya trae (ixid, etc.). */
/** `orientacion` llega como texto desde la base: cualquier valor distinto de «vertical» es horizontal. */
export function urlConTamano(urlRaw: string, orientacion: string): string {
  const u = new URL(urlRaw);
  u.searchParams.set("w", orientacion === "vertical" ? "1080" : "1920");
  u.searchParams.set("q", "80");
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "crop");
  return u.toString();
}

export function conUtm(url: string): string {
  const u = new URL(url);
  for (const [k, v] of new URLSearchParams(UTM)) u.searchParams.set(k, v);
  return u.toString();
}

export function aFotoPublica(
  f: Pick<FotoPool, "id" | "urlRaw" | "ancho" | "alto" | "color" | "blurHash" | "autorNombre" | "autorUsuario" | "urlFoto"> & { orientacion: string },
): FotoPublica {
  return {
    id: f.id,
    url: urlConTamano(f.urlRaw, f.orientacion),
    ancho: f.ancho,
    alto: f.alto,
    color: f.color,
    blurHash: f.blurHash,
    autor: f.autorNombre,
    urlAutor: conUtm(`https://unsplash.com/@${encodeURIComponent(f.autorUsuario)}`),
    urlFoto: conUtm(f.urlFoto),
    urlUnsplash: conUtm("https://unsplash.com/"),
  };
}

/** Texto de atribución exigido por Unsplash: «Foto de {nombre} en Unsplash». */
export const textoAtribucion = (f: Pick<FotoPublica, "autor">) => `Foto de ${f.autor} en Unsplash`;
