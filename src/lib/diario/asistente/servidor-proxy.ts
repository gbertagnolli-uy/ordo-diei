// Asistente del diario (lane 298), lado servidor: la conexión saliente hacia el proveedor de modelos y la traducción de su streaming.
// Defensa contra SSRF (D5): solo `https`, y la dirección IP a la que se conecta se valida en el momento de conectar (no antes), así que un nombre que
// cambia de IP entre la consulta y la conexión no sirve (DNS rebinding). Sin redirecciones. La clave del proveedor nunca se registra ni se devuelve.
import dns from "node:dns";
import https from "node:https";
import type { IncomingMessage } from "node:http";
import type { LookupFunction } from "node:net";
import { direccionPrivada } from "./proveedores";
import { LectorSse, construirPeticion, crearAnalizador, type EventoIA, type PedidoTurno, type Protocolo } from "./protocolos";

export const TIEMPO_MAXIMO_MS = 280_000;
export const SIN_DATOS_MS = 90_000;
const MAX_ERROR_BYTES = 4000;

const lookupSeguro: LookupFunction = (hostname, opciones, devolver) => {
  dns.lookup(hostname, { ...opciones, all: true }, (error, direcciones) => {
    const lista = (direcciones ?? []) as dns.LookupAddress[];
    if (error) return devolver(error, "", 0);
    if (!lista.length || lista.some((d) => direccionPrivada(d.address))) return devolver(new Error("Esa dirección no está permitida"), "", 0);
    if (opciones.all) return (devolver as unknown as (e: null, l: dns.LookupAddress[]) => void)(null, lista);
    devolver(null, lista[0].address, lista[0].family);
  });
};

interface Solicitud {
  url: string;
  metodo: "GET" | "POST";
  headers: Record<string, string>;
  body?: string;
  senal: AbortSignal;
}

/** Una solicitud https al proveedor. Devuelve la respuesta sin leer; el que llama la consume. */
export function solicitar(s: Solicitud): Promise<IncomingMessage> {
  return new Promise((resolver, rechazar) => {
    const url = new URL(s.url);
    if (url.protocol !== "https:") return rechazar(new Error("Solo se admite https"));
    const cuerpo = s.body === undefined ? undefined : Buffer.from(s.body, "utf8");
    const req = https.request(
      url,
      {
        method: s.metodo,
        headers: { ...s.headers, accept: "*/*", ...(cuerpo ? { "content-length": String(cuerpo.length) } : {}) },
        lookup: lookupSeguro,
        signal: s.senal,
        timeout: SIN_DATOS_MS,
      },
      resolver,
    );
    req.on("timeout", () => req.destroy(new Error("El proveedor tardó demasiado en responder")));
    req.on("error", rechazar);
    req.end(cuerpo);
  });
}

async function leerPocoTexto(res: IncomingMessage): Promise<string> {
  const trozos: Buffer[] = [];
  let total = 0;
  for await (const t of res as AsyncIterable<Buffer>) {
    trozos.push(t);
    total += t.length;
    if (total >= MAX_ERROR_BYTES) break;
  }
  res.destroy();
  return Buffer.concat(trozos).toString("utf8").slice(0, MAX_ERROR_BYTES);
}

/** El mensaje de error de un proveedor, sin eco de la clave ni del cuerpo completo. */
export function mensajeDeFalla(estado: number, cuerpo: string, clave: string): string {
  let detalle = "";
  try {
    const j: unknown = JSON.parse(cuerpo);
    const e = typeof j === "object" && j !== null ? (j as { error?: unknown; message?: unknown }) : {};
    const m = typeof e.error === "string" ? e.error : typeof e.error === "object" && e.error !== null ? (e.error as { message?: unknown }).message : e.message;
    if (typeof m === "string") detalle = m;
  } catch {
    detalle = "";
  }
  detalle = detalle.split(clave).join("[clave]").replace(/\s+/g, " ").trim().slice(0, 300);
  const base = estado === 401 || estado === 403 ? "El proveedor rechazó la clave" : estado === 404 ? "El proveedor no encontró el modelo o la dirección" : estado === 429 ? "El proveedor pidió esperar (límite de uso)" : `El proveedor respondió con error ${estado}`;
  return detalle ? `${base}: ${detalle}` : base;
}

/** Un turno al proveedor, como eventos neutros. Los errores salen como un evento `error`, no como excepción. */
export async function* turnoDeProveedor(p: PedidoTurno, senal: AbortSignal): AsyncGenerator<EventoIA> {
  const peticion = construirPeticion(p);
  let res: IncomingMessage;
  try {
    res = await solicitar({ url: peticion.url, metodo: "POST", headers: peticion.headers, body: JSON.stringify(peticion.body), senal });
  } catch (e) {
    if (senal.aborted) return;
    yield { t: "error", mensaje: e instanceof Error && e.message ? `No se pudo conectar con el proveedor: ${e.message}` : "No se pudo conectar con el proveedor" };
    return;
  }
  const estado = res.statusCode ?? 0;
  if (estado < 200 || estado >= 300) {
    yield { t: "error", mensaje: mensajeDeFalla(estado, await leerPocoTexto(res).catch(() => ""), p.apiKey) };
    return;
  }
  const lector = new LectorSse();
  const analizador = crearAnalizador(p.protocolo as Protocolo);
  const decodificador = new TextDecoder();
  let terminado = false;
  try {
    for await (const trozo of res as AsyncIterable<Buffer>) {
      for (const e of lector.alimentar(decodificador.decode(trozo, { stream: true }))) {
        for (const ev of analizador.evento(e)) {
          yield ev;
          if (ev.t === "fin" || ev.t === "error") terminado = true;
        }
      }
    }
    for (const e of lector.terminar()) for (const ev of analizador.evento(e)) yield ev;
  } catch (e) {
    if (senal.aborted) return;
    if (!terminado) yield { t: "error", mensaje: e instanceof Error && e.message ? `Se cortó la conexión con el proveedor: ${e.message}` : "Se cortó la conexión con el proveedor" };
    return;
  }
  if (!terminado) for (const ev of analizador.cierre()) yield ev;
}
