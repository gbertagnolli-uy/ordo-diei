// Propio de Ordo (lane 189, M2b): descarga de un PDF o ePub externo para mostrarlo dentro de la app (un enlace de otro sitio no deja
// incrustarse, y el navegador no puede leerlo por CORS). Solo https, solo hosts públicos (se resuelve el DNS y se rechazan IP
// internas, también en cada redirección), tope de tamaño y de tiempo. La dirección sale siempre de un material guardado.
import { lookup } from "node:dns/promises";
import { esIpPrivada, MAX_BYTES_ARCHIVO, respuestaAceptable } from "../archivoExterno.ts";
import { hostPublico } from "./titulos.ts";

export class DescargaError extends Error {
  status: number;
  constructor(mensaje: string, status = 502) {
    super(mensaje);
    this.status = status;
    this.name = "DescargaError";
  }
}

type Resolver = (host: string) => Promise<string[]>;
type Buscar = (url: string, init: { redirect: "manual"; signal: AbortSignal; headers: Record<string, string> }) => Promise<Response>;

const resolverReal: Resolver = async (host) => (await lookup(host, { all: true })).map((r) => r.address);

async function exigirPublica(url: string, resolver: Resolver) {
  if (!hostPublico(url)) throw new DescargaError("Ese enlace no se puede abrir desde la app", 400);
  let ips: string[];
  try {
    ips = await resolver(new URL(url).hostname);
  } catch {
    throw new DescargaError("No se encontró el sitio del archivo", 502);
  }
  if (ips.length === 0 || ips.some(esIpPrivada)) throw new DescargaError("Ese enlace no se puede abrir desde la app", 400);
}

/** Baja el archivo siguiendo hasta 3 redirecciones; devuelve el cuerpo en streaming con tope de tamaño */
export async function descargarArchivo(url: string, { resolver = resolverReal, buscar = fetch as unknown as Buscar, esperaMs = 20_000 }: { resolver?: Resolver; buscar?: Buscar; esperaMs?: number } = {}): Promise<{ cuerpo: ReadableStream<Uint8Array>; bytes: number | null }> {
  const senal = AbortSignal.timeout(esperaMs);
  let actual = url;
  for (let salto = 0; salto <= 3; salto++) {
    await exigirPublica(actual, resolver);
    let r: Response;
    try {
      r = await buscar(actual, { redirect: "manual", signal: senal, headers: { "User-Agent": "Mozilla/5.0 (compatible; OrdoDiei/1.0)", Accept: "application/pdf,application/epub+zip,*/*;q=0.5" } });
    } catch {
      throw new DescargaError("El sitio del archivo no respondió", 504);
    }
    if (r.status >= 300 && r.status < 400) {
      const destino = r.headers.get("location");
      if (!destino) throw new DescargaError("El sitio del archivo respondió mal");
      actual = new URL(destino, actual).toString();
      continue;
    }
    if (!r.ok || !r.body) throw new DescargaError(r.status === 404 ? "El archivo ya no está en ese enlace" : r.status === 403 || r.status === 401 ? "El archivo no es público: compartilo con «cualquiera con el enlace»" : "No se pudo bajar el archivo", r.status === 404 ? 404 : 502);
    const largo = r.headers.get("content-length");
    const bytes = largo && /^\d+$/.test(largo) ? Number(largo) : null;
    const ok = respuestaAceptable(r.headers.get("content-type"), bytes);
    if (!ok.ok) throw new DescargaError(ok.motivo, 415);
    let leidos = 0;
    const tope = new TransformStream<Uint8Array, Uint8Array>({
      transform(trozo, control) {
        leidos += trozo.byteLength;
        if (leidos > MAX_BYTES_ARCHIVO) control.error(new DescargaError("El archivo es demasiado grande", 413));
        else control.enqueue(trozo);
      },
    });
    return { cuerpo: r.body.pipeThrough(tope), bytes };
  }
  throw new DescargaError("Demasiadas redirecciones");
}
