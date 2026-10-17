import { ConfiguracionRutina, CONFIGURACION_DEFAULT } from "./tipos";

const STORAGE_KEY = "ordo_diei_rutina_config_v1";

/**
 * Lee la configuración de rutina desde localStorage o retorna la predeterminada.
 */
export function obtenerConfiguracionRutina(): ConfiguracionRutina {
  if (typeof window === "undefined") {
    return CONFIGURACION_DEFAULT;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      guardarConfiguracionRutina(CONFIGURACION_DEFAULT);
      return CONFIGURACION_DEFAULT;
    }
    const parsed = JSON.parse(raw);
    // Garantizar que tenga las propiedades mínimas
    if (!parsed || !Array.isArray(parsed.etapas)) {
      return CONFIGURACION_DEFAULT;
    }
    return {
      ...CONFIGURACION_DEFAULT,
      ...parsed,
      etapas: parsed.etapas.length > 0 ? parsed.etapas : CONFIGURACION_DEFAULT.etapas,
    };
  } catch (err) {
    console.error("[StorageRutina] Error al leer configuración:", err);
    return CONFIGURACION_DEFAULT;
  }
}

/**
 * Guarda la configuración en localStorage, notifica a los componentes y sincroniza en segundo plano.
 */
export function guardarConfiguracionRutina(config: ConfiguracionRutina): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Disparar evento para que otras pestañas o componentes se actualicen reactivamente
    window.dispatchEvent(new CustomEvent("rutina-actualizada", { detail: config }));

    // Sincronización optimista con API
    fetch("/api/rutina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).catch(() => {
      // Si el servidor falla o no responde, el cliente ya persistió en localStorage
    });
  } catch (err) {
    console.error("[StorageRutina] Error al guardar configuración:", err);
  }
}

/**
 * Restablece la rutina y metas a la versión oficial predeterminada.
 */
export function restablecerRutinaDefault(): ConfiguracionRutina {
  guardarConfiguracionRutina(CONFIGURACION_DEFAULT);
  return CONFIGURACION_DEFAULT;
}
