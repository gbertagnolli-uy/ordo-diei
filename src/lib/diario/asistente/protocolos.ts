// Asistente del diario (lane 298): traducción entre el formato neutro de la conversación y los dos protocolos de proveedor que usa el asistente
// (Anthropic Messages y OpenAI chat-completions), y lectura de sus respuestas en streaming. Reglas puras: sin red.
// moodiary resuelve esto en un puente en Rust (`fast_core/rig`, ver vendor/moodiary/.../data/impl/rig_assistant.dart); en la web no hay equivalente,
// así que el adaptador es propio. Los datos que viajan (modelo, herramientas, `maxTokens`) son los mismos que arma `AssistantChatRequest`.

export const PROTOCOLOS = ["openai-completions", "anthropic-messages"] as const;
export type Protocolo = (typeof PROTOCOLOS)[number];
export const protocoloDe = (v: unknown): Protocolo => (PROTOCOLOS as readonly unknown[]).includes(v) ? (v as Protocolo) : "openai-completions";

export interface LlamadaIA {
  id: string;
  nombre: string;
  /** Argumentos como texto JSON. */
  args: string;
}

export type MensajeIA =
  | { rol: "usuario"; texto: string }
  | { rol: "asistente"; texto: string; llamadas: LlamadaIA[] }
  | { rol: "resultado"; id: string; nombre: string; texto: string };

export interface HerramientaIA {
  nombre: string;
  descripcion: string;
  esquema: Record<string, unknown>;
}

export interface PedidoTurno {
  protocolo: Protocolo;
  /** URL base del proveedor, sin la ruta final (`https://api.openai.com/v1`, `https://api.anthropic.com`). */
  baseUrl: string;
  apiKey: string;
  modelo: string;
  sistema: string;
  mensajes: MensajeIA[];
  herramientas: HerramientaIA[];
  maxTokens: number;
}

export type MotivoFin = "completo" | "herramientas" | "longitud" | "otro";

/** Lo que el proxy le devuelve al navegador, una línea JSON por evento. */
export type EventoIA =
  | { t: "texto"; d: string }
  | { t: "llamada"; id: string; nombre: string; args: string }
  | { t: "uso"; entrada: number; salida: number; cache: number }
  | { t: "fin"; motivo: MotivoFin }
  | { t: "error"; mensaje: string };

export interface PeticionHttp {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

const sinBarraFinal = (u: string) => u.replace(/\/+$/, "");

function objetoDe(texto: string): Record<string, unknown> {
  if (!texto.trim()) return {};
  try {
    const v: unknown = JSON.parse(texto);
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// ── Anthropic Messages ──────────────────────────────────────────────────────

export const VERSION_ANTHROPIC = "2023-06-01";

function mensajesAnthropic(mensajes: MensajeIA[]): Record<string, unknown>[] {
  const salida: Record<string, unknown>[] = [];
  let resultados: Record<string, unknown>[] = [];
  const soltarResultados = () => {
    if (resultados.length) salida.push({ role: "user", content: resultados });
    resultados = [];
  };
  for (const m of mensajes) {
    if (m.rol === "resultado") {
      resultados.push({ type: "tool_result", tool_use_id: m.id, content: m.texto || "(empty)" });
      continue;
    }
    soltarResultados();
    if (m.rol === "usuario") {
      salida.push({ role: "user", content: m.texto || "(empty)" });
    } else {
      const bloques: Record<string, unknown>[] = [];
      if (m.texto.trim()) bloques.push({ type: "text", text: m.texto });
      for (const l of m.llamadas) bloques.push({ type: "tool_use", id: l.id, name: l.nombre, input: objetoDe(l.args) });
      if (bloques.length) salida.push({ role: "assistant", content: bloques });
    }
  }
  soltarResultados();
  return salida;
}

function peticionAnthropic(p: PedidoTurno): PeticionHttp {
  return {
    url: `${sinBarraFinal(p.baseUrl)}/v1/messages`,
    headers: { "content-type": "application/json", "x-api-key": p.apiKey, "anthropic-version": VERSION_ANTHROPIC },
    body: {
      model: p.modelo,
      max_tokens: p.maxTokens,
      stream: true,
      system: p.sistema,
      messages: mensajesAnthropic(p.mensajes),
      ...(p.herramientas.length ? { tools: p.herramientas.map((h) => ({ name: h.nombre, description: h.descripcion, input_schema: h.esquema })) } : {}),
    },
  };
}

// ── OpenAI chat-completions ─────────────────────────────────────────────────

function mensajesOpenAi(sistema: string, mensajes: MensajeIA[]): Record<string, unknown>[] {
  const salida: Record<string, unknown>[] = [{ role: "system", content: sistema }];
  for (const m of mensajes) {
    if (m.rol === "usuario") salida.push({ role: "user", content: m.texto });
    else if (m.rol === "resultado") salida.push({ role: "tool", tool_call_id: m.id, content: m.texto || "(empty)" });
    else {
      salida.push({
        role: "assistant",
        content: m.texto || null,
        ...(m.llamadas.length ? { tool_calls: m.llamadas.map((l) => ({ id: l.id, type: "function", function: { name: l.nombre, arguments: l.args.trim() || "{}" } })) } : {}),
      });
    }
  }
  return salida;
}

/** OpenAI (y sus modelos de razonamiento) rechaza `max_tokens`; el resto de los proveedores compatibles no conoce `max_completion_tokens`. */
const usaMaxCompletionTokens = (baseUrl: string) => {
  try {
    return new URL(baseUrl).hostname === "api.openai.com";
  } catch {
    return false;
  }
};

function peticionOpenAi(p: PedidoTurno): PeticionHttp {
  return {
    url: `${sinBarraFinal(p.baseUrl)}/chat/completions`,
    headers: { "content-type": "application/json", authorization: `Bearer ${p.apiKey}` },
    body: {
      model: p.modelo,
      stream: true,
      stream_options: { include_usage: true },
      [usaMaxCompletionTokens(p.baseUrl) ? "max_completion_tokens" : "max_tokens"]: p.maxTokens,
      messages: mensajesOpenAi(p.sistema, p.mensajes),
      ...(p.herramientas.length ? { tools: p.herramientas.map((h) => ({ type: "function", function: { name: h.nombre, description: h.descripcion, parameters: h.esquema } })) } : {}),
    },
  };
}

/** La petición HTTP que se le manda al proveedor. */
export function construirPeticion(p: PedidoTurno): PeticionHttp {
  return p.protocolo === "anthropic-messages" ? peticionAnthropic(p) : peticionOpenAi(p);
}

/** Dirección que usa el listado de modelos del proveedor (`/models`). */
export function direccionDeModelos(protocolo: Protocolo, baseUrl: string): string {
  return protocolo === "anthropic-messages" ? `${sinBarraFinal(baseUrl)}/v1/models?limit=100` : `${sinBarraFinal(baseUrl)}/models`;
}

export function cabecerasDeModelos(protocolo: Protocolo, apiKey: string): Record<string, string> {
  return protocolo === "anthropic-messages" ? { "x-api-key": apiKey, "anthropic-version": VERSION_ANTHROPIC } : { authorization: `Bearer ${apiKey}` };
}

/** Los ids de modelo de la respuesta de `/models` de cualquiera de los dos protocolos. */
export function modelosDe(respuesta: unknown): string[] {
  const datos = typeof respuesta === "object" && respuesta !== null ? (respuesta as { data?: unknown }).data : undefined;
  if (!Array.isArray(datos)) return [];
  const ids = new Set<string>();
  for (const d of datos) {
    const id = typeof d === "object" && d !== null ? (d as { id?: unknown }).id : undefined;
    if (typeof id === "string" && id.trim()) ids.add(id.trim());
  }
  return [...ids].sort();
}

// ── Lectura del streaming ───────────────────────────────────────────────────

export interface EventoSse {
  evento: string;
  datos: string;
}

/** Corta el texto de un stream SSE en eventos completos. Aguanta que un evento llegue partido en varios trozos. */
export class LectorSse {
  private resto = "";

  alimentar(trozo: string): EventoSse[] {
    this.resto += trozo.replace(/\r\n?/g, "\n");
    const salida: EventoSse[] = [];
    let corte: number;
    while ((corte = this.resto.indexOf("\n\n")) !== -1) {
      const bloque = this.resto.slice(0, corte);
      this.resto = this.resto.slice(corte + 2);
      const e = this.leerBloque(bloque);
      if (e) salida.push(e);
    }
    return salida;
  }

  /** Lo que quedó sin cerrar con línea en blanco al terminar el stream. */
  terminar(): EventoSse[] {
    const e = this.resto.trim() ? this.leerBloque(this.resto) : null;
    this.resto = "";
    return e ? [e] : [];
  }

  private leerBloque(bloque: string): EventoSse | null {
    let evento = "message";
    const datos: string[] = [];
    for (const linea of bloque.split("\n")) {
      if (!linea || linea.startsWith(":")) continue;
      const i = linea.indexOf(":");
      const campo = i === -1 ? linea : linea.slice(0, i);
      const valor = i === -1 ? "" : linea.slice(i + 1).replace(/^ /, "");
      if (campo === "event") evento = valor;
      else if (campo === "data") datos.push(valor);
    }
    return datos.length ? { evento, datos: datos.join("\n") } : null;
  }
}

export interface Analizador {
  /** Un evento SSE del proveedor → cero o más eventos neutros. */
  evento(e: EventoSse): EventoIA[];
  /** El stream se cortó: lo que quedó pendiente (por ejemplo, llamadas a herramientas) y un `fin` si todavía no hubo. */
  cierre(): EventoIA[];
}

const entero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0);

function json(datos: string): Record<string, unknown> | null {
  try {
    const v: unknown = JSON.parse(datos);
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const mensajeDeError = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null) {
    const m = (v as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return "El proveedor devolvió un error";
};

function analizadorAnthropic(): Analizador {
  const bloques = new Map<number, { id: string; nombre: string; args: string }>();
  let entrada = 0;
  let cache = 0;
  let salida = 0;
  let motivo: MotivoFin | null = null;
  let terminado = false;

  const fin = (): EventoIA[] => {
    if (terminado) return [];
    terminado = true;
    return [{ t: "uso", entrada, salida, cache }, { t: "fin", motivo: motivo ?? "otro" }];
  };

  return {
    evento(e) {
      const d = json(e.datos);
      if (!d) return [];
      const tipo = typeof d.type === "string" ? d.type : e.evento;
      switch (tipo) {
        case "message_start": {
          const u = (d.message as { usage?: Record<string, unknown> } | undefined)?.usage ?? {};
          cache = entero(u.cache_read_input_tokens);
          entrada = entero(u.input_tokens) + cache + entero(u.cache_creation_input_tokens);
          salida = entero(u.output_tokens);
          return [];
        }
        case "content_block_start": {
          const b = d.content_block as { type?: string; id?: string; name?: string } | undefined;
          if (b?.type === "tool_use") bloques.set(entero(d.index), { id: String(b.id ?? ""), nombre: String(b.name ?? ""), args: "" });
          return [];
        }
        case "content_block_delta": {
          const delta = d.delta as { type?: string; text?: string; partial_json?: string } | undefined;
          if (delta?.type === "text_delta" && delta.text) return [{ t: "texto", d: delta.text }];
          if (delta?.type === "input_json_delta") {
            const b = bloques.get(entero(d.index));
            if (b) b.args += delta.partial_json ?? "";
          }
          return [];
        }
        case "content_block_stop": {
          const i = entero(d.index);
          const b = bloques.get(i);
          if (!b) return [];
          bloques.delete(i);
          return [{ t: "llamada", id: b.id, nombre: b.nombre, args: b.args.trim() || "{}" }];
        }
        case "message_delta": {
          const delta = d.delta as { stop_reason?: string } | undefined;
          const u = d.usage as Record<string, unknown> | undefined;
          if (u && u.output_tokens !== undefined) salida = entero(u.output_tokens);
          const r = delta?.stop_reason;
          if (r) motivo = r === "tool_use" ? "herramientas" : r === "max_tokens" ? "longitud" : r === "end_turn" || r === "stop_sequence" ? "completo" : "otro";
          return [];
        }
        case "message_stop":
          return fin();
        case "error":
          terminado = true;
          return [{ t: "error", mensaje: mensajeDeError(d.error) }];
        default:
          return [];
      }
    },
    cierre() {
      return fin();
    },
  };
}

function analizadorOpenAi(): Analizador {
  const llamadas = new Map<number, { id: string; nombre: string; args: string }>();
  let entrada = 0;
  let cache = 0;
  let salida = 0;
  let motivo: MotivoFin | null = null;
  let terminado = false;

  const soltarLlamadas = (): EventoIA[] => {
    const eventos: EventoIA[] = [...llamadas.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, l], i) => ({ t: "llamada" as const, id: l.id || `llamada_${i}`, nombre: l.nombre, args: l.args.trim() || "{}" }));
    llamadas.clear();
    return eventos;
  };

  const fin = (): EventoIA[] => {
    if (terminado) return [];
    terminado = true;
    const pendientes = soltarLlamadas();
    return [...pendientes, { t: "uso", entrada, salida, cache }, { t: "fin", motivo: motivo ?? (pendientes.length ? "herramientas" : "completo") }];
  };

  return {
    evento(e) {
      if (e.datos.trim() === "[DONE]") return fin();
      const d = json(e.datos);
      if (!d) return [];
      if (d.error) {
        terminado = true;
        return [{ t: "error", mensaje: mensajeDeError(d.error) }];
      }
      const u = d.usage as { prompt_tokens?: unknown; completion_tokens?: unknown; prompt_tokens_details?: { cached_tokens?: unknown } } | null | undefined;
      if (u) {
        entrada = entero(u.prompt_tokens);
        salida = entero(u.completion_tokens);
        cache = entero(u.prompt_tokens_details?.cached_tokens);
      }
      const eventos: EventoIA[] = [];
      const eleccion = (d.choices as { delta?: Record<string, unknown>; finish_reason?: string | null }[] | undefined)?.[0];
      const delta = eleccion?.delta;
      if (delta) {
        if (typeof delta.content === "string" && delta.content) eventos.push({ t: "texto", d: delta.content });
        const partes = delta.tool_calls as { index?: number; id?: string; function?: { name?: string; arguments?: string } }[] | undefined;
        for (const p of partes ?? []) {
          const i = entero(p.index);
          const l = llamadas.get(i) ?? { id: "", nombre: "", args: "" };
          if (p.id) l.id = p.id;
          if (p.function?.name) l.nombre += p.function.name;
          if (p.function?.arguments) l.args += p.function.arguments;
          llamadas.set(i, l);
        }
      }
      const razon = eleccion?.finish_reason;
      if (razon) {
        motivo = razon === "tool_calls" || razon === "function_call" ? "herramientas" : razon === "length" ? "longitud" : razon === "stop" ? "completo" : "otro";
        eventos.push(...soltarLlamadas());
      }
      return eventos;
    },
    cierre() {
      return fin();
    },
  };
}

export const crearAnalizador = (protocolo: Protocolo): Analizador => (protocolo === "anthropic-messages" ? analizadorAnthropic() : analizadorOpenAi());
