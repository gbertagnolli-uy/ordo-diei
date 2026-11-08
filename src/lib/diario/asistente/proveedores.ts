// Asistente del diario (lane 298): proveedores de modelos (presets y proveedor propio) y las guardas de la URL a la que el proxy se conecta. Reglas puras.
// Portado de la idea de vendor/moodiary/.../data/{llm_provider_repository,model_resolver}.dart y de los presets de `llm_preset_repository.dart`
// (ZhuJHua/moodiary@2c552dd). moodiary baja el catálogo de presets de internet; acá es una lista fija y el modelo se puede escribir a mano.

import { protocoloDe, type Protocolo } from "./protocolos.ts";

export interface Preset {
  id: string;
  nombre: string;
  protocolo: Protocolo;
  baseUrl: string;
  /** Modelos conocidos al escribir esto; la lista real se puede pedir al proveedor. */
  modelos: string[];
  /** Dónde se saca la clave (solo para mostrar). */
  clave: string;
}

export const PRESETS: Preset[] = [
  { id: "anthropic", nombre: "Anthropic (Claude)", protocolo: "anthropic-messages", baseUrl: "https://api.anthropic.com", modelos: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"], clave: "console.anthropic.com" },
  { id: "openai", nombre: "OpenAI", protocolo: "openai-completions", baseUrl: "https://api.openai.com/v1", modelos: ["gpt-5", "gpt-5-mini", "gpt-4.1"], clave: "platform.openai.com" },
  { id: "deepseek", nombre: "DeepSeek", protocolo: "openai-completions", baseUrl: "https://api.deepseek.com/v1", modelos: ["deepseek-chat", "deepseek-reasoner"], clave: "platform.deepseek.com" },
  { id: "gemini", nombre: "Google Gemini", protocolo: "openai-completions", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", modelos: ["gemini-2.5-flash", "gemini-2.5-pro"], clave: "aistudio.google.com" },
  { id: "openrouter", nombre: "OpenRouter", protocolo: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", modelos: ["anthropic/claude-sonnet-4.5", "openai/gpt-5-mini", "google/gemini-2.5-flash"], clave: "openrouter.ai" },
  { id: "groq", nombre: "Groq", protocolo: "openai-completions", baseUrl: "https://api.groq.com/openai/v1", modelos: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"], clave: "console.groq.com" },
  { id: "mistral", nombre: "Mistral", protocolo: "openai-completions", baseUrl: "https://api.mistral.ai/v1", modelos: ["mistral-large-latest", "mistral-small-latest"], clave: "console.mistral.ai" },
  { id: "xai", nombre: "xAI (Grok)", protocolo: "openai-completions", baseUrl: "https://api.x.ai/v1", modelos: ["grok-4", "grok-3-mini"], clave: "console.x.ai" },
  { id: "moonshot", nombre: "Moonshot (Kimi)", protocolo: "openai-completions", baseUrl: "https://api.moonshot.ai/v1", modelos: ["kimi-k2-0905-preview"], clave: "platform.moonshot.ai" },
];

export const presetDe = (id: string | null | undefined): Preset | undefined => PRESETS.find((p) => p.id === id);

/** Un proveedor guardado en el navegador. La clave vive aparte (ver `almacen`), nunca dentro de este objeto. */
export interface Proveedor {
  id: string;
  nombre: string;
  /** Si viene de un preset; null = proveedor propio. */
  presetId: string | null;
  protocolo: Protocolo;
  baseUrl: string;
  /** Modelo que se usa por defecto. */
  modelo: string;
  /** Otros modelos para elegir. */
  modelos: string[];
}

export const MAX_PROVEEDORES = 12;
export const MAX_NOMBRE_PROVEEDOR = 60;
export const MAX_MODELO = 120;
export const MAX_CLAVE = 400;

const NOMBRE_HOST_PROHIBIDO = /(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/i;

/** ¿La IP es de una red a la que un servidor público no debería conectarse a pedido de un usuario? (SSRF). */
export function direccionPrivada(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  const m4 = /^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(v);
  if (m4) {
    const [a, b] = [Number(m4[1]), Number(m4[2])];
    if ([a, b, Number(m4[3]), Number(m4[4])].some((n) => n > 255)) return true;
    return (
      a === 0 || // «esta red»
      a === 10 ||
      a === 127 || // loopback
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local y metadatos de la nube
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) || // 192.0.0.0/24 y 192.0.2.0/24
      (a === 198 && (b === 18 || b === 19)) || // pruebas de rendimiento
      a >= 224 // multicast y reservadas
    );
  }
  if (v.includes(":")) {
    if (v === "::" || v === "::1") return true;
    if (/^f[cd]/.test(v)) return true; // fc00::/7 (únicas locales)
    if (/^fe[89ab]/.test(v)) return true; // fe80::/10 (link-local)
    if (/^ff/.test(v)) return true; // multicast
    if (/^::ffff:[0-9a-f]{1,4}:[0-9a-f]{1,4}$/.test(v)) return true; // IPv4 mapeada en hexadecimal: no se decodifica, se descarta
    return false;
  }
  return true; // no es una IP que sepamos leer: no se confía
}

export interface UrlValida {
  url: URL;
  /** URL normalizada: https, sin barra final, sin parámetros ni credenciales. */
  base: string;
}

/**
 * Valida la URL base de un proveedor antes de guardarla y otra vez antes de conectarse: solo `https`, puerto estándar, sin usuario ni contraseña,
 * sin parámetros y sin nombres de máquinas internas ni IP privadas escritas a mano. (El DNS se resuelve aparte, en el servidor.)
 */
export function validarUrlBase(crudo: string): UrlValida {
  const texto = crudo.trim();
  if (!texto || texto.length > 300) throw new Error("La dirección del proveedor no es válida");
  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    throw new Error("La dirección del proveedor no es válida");
  }
  if (url.protocol !== "https:") throw new Error("La dirección del proveedor tiene que empezar con https://");
  if (url.username || url.password) throw new Error("La dirección no puede llevar usuario ni contraseña");
  if (url.port && url.port !== "443") throw new Error("Solo se admite el puerto estándar (443)");
  if (url.search || url.hash) throw new Error("La dirección no puede llevar parámetros");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || NOMBRE_HOST_PROHIBIDO.test(host)) throw new Error("Esa dirección no está permitida");
  const esIp = /^[\d.]+$/.test(host) || host.includes(":");
  if (esIp && direccionPrivada(host)) throw new Error("Esa dirección no está permitida");
  if (!esIp && !host.includes(".")) throw new Error("Esa dirección no está permitida");
  return { url, base: `https://${url.host}${url.pathname}`.replace(/\/+$/, "") };
}

/** Reconstruye un proveedor leído del almacén local; devuelve null si no sirve. */
export function proveedorValido(crudo: unknown): Proveedor | null {
  if (typeof crudo !== "object" || crudo === null) return null;
  const p = crudo as Record<string, unknown>;
  const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const id = texto(p.id, 60);
  const nombre = texto(p.nombre, MAX_NOMBRE_PROVEEDOR);
  const modelo = texto(p.modelo, MAX_MODELO);
  if (!id || !nombre) return null;
  let base: string;
  try {
    base = validarUrlBase(texto(p.baseUrl, 300)).base;
  } catch {
    return null;
  }
  const modelos = Array.isArray(p.modelos) ? [...new Set(p.modelos.map((m) => texto(m, MAX_MODELO)).filter(Boolean))].slice(0, 200) : [];
  return {
    id,
    nombre,
    presetId: typeof p.presetId === "string" && presetDe(p.presetId) ? p.presetId : null,
    protocolo: protocoloDe(p.protocolo),
    baseUrl: base,
    modelo,
    modelos,
  };
}

let contador = 0;
export const idProveedor = () => `p${Date.now().toString(36)}${(contador++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function proveedorDePreset(preset: Preset): Proveedor {
  return { id: idProveedor(), nombre: preset.nombre, presetId: preset.id, protocolo: preset.protocolo, baseUrl: preset.baseUrl, modelo: preset.modelos[0] ?? "", modelos: [...preset.modelos] };
}

/** moodiary `ModelResolver.optionsFor`: los modelos que se pueden elegir, el predeterminado primero. */
export function opcionesDeModelo(p: Proveedor): string[] {
  const ids = new Set<string>();
  if (p.modelo) ids.add(p.modelo);
  for (const m of p.modelos) ids.add(m);
  return [...ids];
}
