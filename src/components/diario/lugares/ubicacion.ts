"use client";
// Diario (lane 296): la ubicación del dispositivo y el clima de ahora. Portado de vendor/moodiary/.../moodiary_editor/lib/src/application/edit_controller.dart
// (`fetchPosition`, `fetchWeather`) y de los servicios de ubicación de moodiary (ZhuJHua/moodiary@2c552dd): preciso (hasta 20 s) o reciente (hasta 10 min).
import { TEXTO_FALLO_UBICACION, falloDeGeolocalizacion, type Coordenadas } from "@/lib/diario/lugares";
import type { Clima } from "@/lib/diario/clima";

const ESPERA_PRECISA_MS = 20_000;
const ESPERA_RECIENTE_MS = 10_000;
const EDAD_RECIENTE_MS = 10 * 60_000;

/** moodiary `getPreciseLocation` (preciso) / `getRecentLocation` (reciente, hasta 10 min de antigüedad). Falla con el texto para mostrar. */
export function obtenerUbicacion(preciso: boolean): Promise<Coordenadas> {
  return new Promise((resolver, rechazar) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return rechazar(new Error(TEXTO_FALLO_UBICACION.noDisponible));
    navigator.geolocation.getCurrentPosition(
      (p) => resolver({ latitud: p.coords.latitude, longitud: p.coords.longitude }),
      (e) => rechazar(new Error(TEXTO_FALLO_UBICACION[falloDeGeolocalizacion(e.code)])),
      { enableHighAccuracy: preciso, timeout: preciso ? ESPERA_PRECISA_MS : ESPERA_RECIENTE_MS, maximumAge: preciso ? 0 : EDAD_RECIENTE_MS },
    );
  });
}

/** Si el navegador ya dio permiso de ubicación (así se puede usar sin molestar). Sin la API de permisos, false. */
export async function tengoPermisoDeUbicacion(): Promise<boolean> {
  try {
    return (await navigator.permissions.query({ name: "geolocation" })).state === "granted";
  } catch {
    return false;
  }
}

/** El clima de ahora en un punto (Open-Meteo, desde el servidor). Falla con un mensaje si el servicio no responde. */
export async function obtenerClima(punto: Coordenadas): Promise<Clima> {
  const r = await fetch(`/api/diario/clima?latitud=${punto.latitud}&longitud=${punto.longitud}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "No se pudo obtener el clima");
  if (!d.clima) throw new Error("El servicio del clima no respondió");
  return d.clima as Clima;
}
