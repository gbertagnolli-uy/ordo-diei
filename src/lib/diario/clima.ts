// Diario (lane 296): reglas puras del clima de la entrada. Sin base de datos ni red, con tests.
// Portado de vendor/moodiary/packages/feature_base/moodiary_models/lib/src/{manual_weather,diary_meta}.dart (`ManualWeather`, `DiaryWeather.displayText` / `compactText`)
// y de moodiary_editor/lib/src/data/weather_repository.dart (ZhuJHua/moodiary@2c552dd). Los códigos son los de QWeather, que moodiary guarda tal cual.

export const MAX_TEXTO_CLIMA = 40;
export const TEMP_MIN = -90;
export const TEMP_MAX = 70;

export interface Clima {
  /** Código de QWeather (`100` soleado, `305` lluvia débil…), como lo guarda moodiary. */
  codigo: string;
  /** °C, entero; null = sin temperatura. */
  temp: number | null;
  texto: string;
}

/** moodiary `ManualWeather`, en el mismo orden. */
export const CLIMAS_MANUALES = [
  { codigo: "100", texto: "Soleado" },
  { codigo: "101", texto: "Nublado" },
  { codigo: "104", texto: "Cubierto" },
  { codigo: "300", texto: "Chubascos" },
  { codigo: "305", texto: "Lluvia débil" },
  { codigo: "306", texto: "Lluvia moderada" },
  { codigo: "307", texto: "Lluvia fuerte" },
  { codigo: "310", texto: "Temporal" },
  { codigo: "302", texto: "Tormenta eléctrica" },
  { codigo: "400", texto: "Nieve débil" },
  { codigo: "402", texto: "Nieve fuerte" },
  { codigo: "404", texto: "Aguanieve" },
  { codigo: "501", texto: "Niebla" },
  { codigo: "502", texto: "Bruma" },
  { codigo: "900", texto: "Calor" },
  { codigo: "901", texto: "Frío" },
] as const;

/** Texto de los códigos que se generan solos (Open-Meteo) además de los manuales. */
const OTROS_TEXTOS: Record<string, string> = {
  "102": "Pocas nubes",
  "103": "Parcialmente nublado",
  "150": "Despejado",
  "151": "Nublado",
  "152": "Pocas nubes",
  "153": "Parcialmente nublado",
  "301": "Chubascos fuertes",
  "304": "Tormenta con granizo",
  "309": "Llovizna",
  "313": "Lluvia helada",
  "401": "Nieve moderada",
  "407": "Chubascos de nieve",
  "499": "Nieve",
};

const TEXTO_POR_CODIGO: Record<string, string> = { ...Object.fromEntries(CLIMAS_MANUALES.map((c) => [c.codigo, c.texto])), ...OTROS_TEXTOS };

/** El texto en español de un código conocido, o null. */
export const textoDeCodigo = (codigo: string): string | null => TEXTO_POR_CODIGO[codigo] ?? null;

/** Familia del ícono. El dibujo (lucide) lo elige la interfaz. */
export type GrupoClima = "sol" | "parcial" | "nublado" | "luna" | "lunaNube" | "llovizna" | "lluvia" | "tormenta" | "nieve" | "niebla" | "calor" | "frio" | "desconocido";

/** Agrupa los códigos de QWeather por su rango (documentación de la API: 1xx cielo, 3xx lluvia, 4xx nieve, 5xx niebla, 9xx temperatura). */
export function grupoDeClima(codigo: string | null | undefined): GrupoClima {
  if (!codigo || !/^\d{3,4}$/.test(codigo)) return "desconocido";
  const n = Number(codigo);
  if (n === 100) return "sol";
  if (n === 101 || n === 102 || n === 103) return "parcial";
  if (n === 104) return "nublado";
  if (n === 150) return "luna";
  if (n >= 151 && n <= 153) return "lunaNube";
  if (n === 302 || n === 303 || n === 304) return "tormenta";
  if (n === 309 || n === 314 || n === 350) return "llovizna";
  if (n >= 300 && n <= 399) return "lluvia";
  if (n >= 400 && n <= 499) return "nieve";
  if (n >= 500 && n <= 515) return "niebla";
  if (n === 900) return "calor";
  if (n === 901) return "frio";
  return "desconocido";
}

const entero = (t: number) => Math.round(t);

/** moodiary `displayText`: «Soleado 23°», o solo el texto si no hay temperatura. */
export const textoClima = (c: Pick<Clima, "texto" | "temp">): string => (c.temp === null ? c.texto : `${c.texto} ${c.temp}°`);

/** moodiary `compactText`: «23°», o el texto si no hay temperatura (lo que se ve en las tarjetas). */
export const textoClimaCompacto = (c: Pick<Clima, "texto" | "temp">): string => (c.temp === null ? c.texto : `${c.temp}°`);

/** Un clima de la lista manual: sin temperatura (moodiary `_onChangeWeather` guarda solo código y texto). */
export function climaManual(codigo: string): Clima | null {
  const op = CLIMAS_MANUALES.find((c) => c.codigo === codigo);
  return op ? { codigo: op.codigo, temp: null, texto: op.texto } : null;
}

/**
 * Forma del cuerpo: `null` = sin clima (se borra), `undefined` = no se toca.
 * Acepta un código conocido sin texto (se completa) o un código desconocido con su texto (lo que trae una importación).
 */
export function validarClima(raw: unknown): Clima | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) throw new Error("Clima inválido");
  const b = raw as Record<string, unknown>;
  const codigo = typeof b.codigo === "string" ? b.codigo.trim() : typeof b.codigo === "number" ? String(b.codigo) : "";
  if (!/^\d{3,4}$/.test(codigo)) throw new Error("Clima inválido");
  const crudo = typeof b.texto === "string" ? b.texto.replace(/\s+/g, " ").trim() : "";
  const texto = crudo || textoDeCodigo(codigo);
  if (!texto) throw new Error("El clima necesita un texto");
  if (texto.length > MAX_TEXTO_CLIMA) throw new Error(`El texto del clima admite hasta ${MAX_TEXTO_CLIMA} caracteres`);
  let temp: number | null = null;
  if (b.temp !== null && b.temp !== undefined && b.temp !== "") {
    const n = typeof b.temp === "number" ? b.temp : Number(String(b.temp).replace(",", "."));
    if (!Number.isFinite(n) || n < TEMP_MIN || n > TEMP_MAX) throw new Error("Temperatura inválida");
    temp = entero(n);
  }
  return { codigo, temp, texto };
}

// ── Open-Meteo ──────────────────────────────────────────────────────────────

/**
 * Código WMO (`weather_code` de Open-Meteo) → código de QWeather. La noche solo cambia el cielo despejado o poco nublado
 * (QWeather tiene 150–153 para eso).
 */
export function codigoDeWmo(wmo: number, esDeDia: boolean): string | null {
  switch (wmo) {
    case 0:
      return esDeDia ? "100" : "150";
    case 1:
      return esDeDia ? "102" : "152";
    case 2:
      return esDeDia ? "103" : "153";
    case 3:
      return "104";
    case 45:
    case 48:
      return "501";
    case 51:
    case 53:
    case 55:
      return "309";
    case 56:
    case 57:
    case 66:
    case 67:
      return "313";
    case 61:
      return "305";
    case 63:
      return "306";
    case 65:
      return "307";
    case 71:
      return "400";
    case 73:
      return "401";
    case 75:
      return "402";
    case 77:
      return "499";
    case 80:
      return "300";
    case 81:
    case 82:
      return "301";
    case 85:
    case 86:
      return "407";
    case 95:
      return "302";
    case 96:
    case 99:
      return "304";
    default:
      return null;
  }
}

/** Respuesta de `current=temperature_2m,weather_code,is_day` de Open-Meteo → clima de la entrada, o null si no se entiende. */
export function climaDeOpenMeteo(respuesta: unknown): Clima | null {
  const actual = (respuesta as { current?: { temperature_2m?: unknown; weather_code?: unknown; is_day?: unknown } } | null)?.current;
  if (!actual || typeof actual.weather_code !== "number") return null;
  const codigo = codigoDeWmo(actual.weather_code, actual.is_day !== 0);
  const texto = codigo ? textoDeCodigo(codigo) : null;
  if (!codigo || !texto) return null;
  const t = actual.temperature_2m;
  const temp = typeof t === "number" && Number.isFinite(t) && t >= TEMP_MIN && t <= TEMP_MAX ? entero(t) : null;
  return { codigo, temp, texto };
}

// ── Markdown (front matter de moodiary) ─────────────────────────────────────

/** moodiary `_yamlList`: `weather: ["100", "23", "Soleado"]`, la temperatura vacía si no hay. */
export const climaAFrontMatter = (c: Clima): [string, string, string] => [c.codigo, c.temp === null ? "" : String(c.temp), c.texto];

/** Lee `weather:` del front matter (lista de 3 o mapa `{icon, temp, text}`); lo que no se entiende da null. */
export function climaDeFrontMatter(v: unknown): Clima | null {
  let codigo: unknown;
  let temp: unknown;
  let texto: unknown;
  if (Array.isArray(v)) [codigo, temp, texto] = v;
  else if (v && typeof v === "object") ({ icon: codigo, temp, text: texto } = v as Record<string, unknown>);
  else return null;
  try {
    return validarClima({ codigo: typeof codigo === "number" ? String(codigo) : codigo, temp: temp === "" ? null : temp, texto: typeof texto === "string" ? texto : "" }) ?? null;
  } catch {
    return null;
  }
}
