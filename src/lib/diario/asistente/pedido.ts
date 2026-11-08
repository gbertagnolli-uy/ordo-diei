// Asistente del diario (lane 298): validación del cuerpo que el navegador manda al proxy de turnos. Reglas puras.
// El servidor no confía en el cliente: acota tamaños, valida la URL del proveedor y NO acepta definiciones de herramientas (usa las suyas).

import { DEFINICIONES, MAX_TOKENS_RESPUESTA, esHerramienta, esHerramientaDelDiario } from "./herramientas.ts";
import { MAX_CLAVE, MAX_MODELO, validarUrlBase } from "./proveedores.ts";
import { protocoloDe, type HerramientaIA, type LlamadaIA, type MensajeIA, type PedidoTurno } from "./protocolos.ts";

export const MAX_BYTES_PEDIDO = 1_500_000;
export const MAX_MENSAJES_PEDIDO = 240;
export const MAX_TEXTO_MENSAJE_PEDIDO = 120_000;
export const MAX_SISTEMA = 30_000;
export const MIN_TOKENS = 16;

type Objeto = Record<string, unknown>;
const esObjeto = (v: unknown): v is Objeto => typeof v === "object" && v !== null && !Array.isArray(v);
const cadena = (v: unknown, max: number, nombre: string): string => {
  if (typeof v !== "string") throw new Error(`${nombre} inválido`);
  if (v.length > max) throw new Error(`${nombre} demasiado largo`);
  return v;
};

function llamadaValida(v: unknown): LlamadaIA {
  if (!esObjeto(v)) throw new Error("Mensaje inválido");
  const nombre = cadena(v.nombre, 60, "Nombre de herramienta");
  if (!esHerramienta(nombre)) throw new Error("Herramienta desconocida");
  return { id: cadena(v.id, 200, "Id de llamada"), nombre, args: cadena(v.args ?? "", 60_000, "Argumentos") };
}

function mensajeValido(v: unknown): MensajeIA {
  if (!esObjeto(v)) throw new Error("Mensaje inválido");
  if (v.rol === "usuario") return { rol: "usuario", texto: cadena(v.texto, MAX_TEXTO_MENSAJE_PEDIDO, "Mensaje") };
  if (v.rol === "asistente") {
    const llamadas = v.llamadas === undefined ? [] : Array.isArray(v.llamadas) ? v.llamadas.map(llamadaValida) : null;
    if (!llamadas || llamadas.length > 40) throw new Error("Mensaje inválido");
    return { rol: "asistente", texto: cadena(v.texto ?? "", MAX_TEXTO_MENSAJE_PEDIDO, "Mensaje"), llamadas };
  }
  if (v.rol === "resultado") return { rol: "resultado", id: cadena(v.id, 200, "Id de llamada"), nombre: cadena(v.nombre, 60, "Nombre"), texto: cadena(v.texto ?? "", MAX_TEXTO_MENSAJE_PEDIDO, "Resultado") };
  throw new Error("Mensaje inválido");
}

/** Las herramientas con el contrato del servidor (el cliente solo dice si las quiere): las del diario y, si la memoria está encendida, las tres de memoria (lane 299). */
export const herramientasParaElModelo = (conMemoria = false): HerramientaIA[] =>
  DEFINICIONES.filter((d) => conMemoria || esHerramientaDelDiario(d.nombre)).map((d) => ({ nombre: d.nombre, descripcion: d.descripcion, esquema: d.esquema }));

/** Cuerpo del pedido → pedido validado. Lanza `Error` con un mensaje para la persona si algo no sirve. */
export function validarPedido(cuerpo: unknown): PedidoTurno {
  if (!esObjeto(cuerpo)) throw new Error("Pedido inválido");
  const { base } = validarUrlBase(cadena(cuerpo.baseUrl, 300, "Dirección"));
  const apiKey = cadena(cuerpo.apiKey, MAX_CLAVE, "Clave").trim();
  if (!apiKey || /[\r\n]/.test(apiKey)) throw new Error("La clave no es válida");
  const modelo = cadena(cuerpo.modelo, MAX_MODELO, "Modelo").trim();
  if (!modelo) throw new Error("Elegí un modelo");
  if (!Array.isArray(cuerpo.mensajes) || !cuerpo.mensajes.length || cuerpo.mensajes.length > MAX_MENSAJES_PEDIDO) throw new Error("Mensajes inválidos");
  const mensajes = cuerpo.mensajes.map(mensajeValido);
  if (mensajes[0].rol !== "usuario") throw new Error("La conversación tiene que empezar con un mensaje de la persona");
  const maxTokens = typeof cuerpo.maxTokens === "number" && Number.isFinite(cuerpo.maxTokens) ? Math.trunc(cuerpo.maxTokens) : MAX_TOKENS_RESPUESTA;
  return {
    protocolo: protocoloDe(cuerpo.protocolo),
    baseUrl: base,
    apiKey,
    modelo,
    sistema: cadena(cuerpo.sistema ?? "", MAX_SISTEMA, "Instrucciones"),
    mensajes,
    herramientas: cuerpo.herramientas === true ? herramientasParaElModelo(cuerpo.memoria === true) : [],
    maxTokens: Math.min(MAX_TOKENS_RESPUESTA, Math.max(MIN_TOKENS, maxTokens)),
  };
}
