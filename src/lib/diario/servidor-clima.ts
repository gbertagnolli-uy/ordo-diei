// Diario (lane 296), lado servidor: clima y nombre de un lugar a partir de coordenadas.
// moodiary consulta QWeather (`weather_repository.dart`, `geo_repository.dart`); acá se usan Open-Meteo (sin clave) y Nominatim de OpenStreetMap.
// En los dos casos la posición sale redondeada a 2 decimales (≈ 1 km), como `qweatherLocation`, y nada se guarda fuera de la entrada.
import { climaDeOpenMeteo, type Clima } from "./clima";
import { nombreDeDireccion, redondearParaConsulta, validarLatitud, validarLongitud } from "./lugares";

const TIEMPO_MAXIMO_MS = 8000;
const AGENTE = "OrdoDiei/1.0 (diario familiar; reverse geocoding)";

async function pedirJson(url: string, cabeceras: Record<string, string> = {}): Promise<unknown> {
  const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS), headers: { accept: "application/json", ...cabeceras } });
  if (!r.ok) throw new Error(`El servicio respondió ${r.status}`);
  return r.json();
}

/** Clima actual en un punto, o null si el servicio no responde o no se entiende. */
export async function climaActual(latitud: unknown, longitud: unknown): Promise<Clima | null> {
  const lat = redondearParaConsulta(validarLatitud(latitud));
  const lon = redondearParaConsulta(validarLongitud(longitud));
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
  try {
    return climaDeOpenMeteo(await pedirJson(url));
  } catch {
    return null;
  }
}

// Nominatim pide como mucho una consulta por segundo: se encolan dentro de la misma instancia.
let ultima = Promise.resolve();
let ultimaHora = 0;

function esperarTurno(): Promise<void> {
  const turno = ultima.then(async () => {
    const espera = ultimaHora + 1100 - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimaHora = Date.now();
  });
  ultima = turno.catch(() => undefined);
  return turno;
}

/** Nombre del lugar donde queda un punto («Pocitos, Montevideo»), o null. Con 4 decimales (≈ 10 m): alcanza para la calle y no se manda más. */
export async function nombreDeUbicacion(latitud: number, longitud: number): Promise<string | null> {
  const lat = latitud.toFixed(4);
  const lon = longitud.toFixed(4);
  try {
    await esperarTurno();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1&accept-language=es&lat=${lat}&lon=${lon}`;
    const r = (await pedirJson(url, { "user-agent": AGENTE })) as { address?: unknown };
    return nombreDeDireccion(r.address);
  } catch {
    return null;
  }
}
