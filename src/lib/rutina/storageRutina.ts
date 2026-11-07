import { ConfiguracionRutina, CONFIGURACION_DEFAULT } from "./tipos";

const STORAGE_KEY = "ordo_diei_rutina_config_v1";

// Lane 259: la rutina BASE (etapas + notas semanales) es de la familia y vive en el servidor.
// Se publica solo cuando cambia; lo demás (sonido, ajuste del día, cumplidas, metas) es del dispositivo.
let ultimaBasePublicada: string | null = null;
const claveBase = (c: Pick<ConfiguracionRutina, "etapas" | "semanalConfig">) =>
  JSON.stringify({ etapas: c.etapas, semanalConfig: c.semanalConfig });

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
      // Dispositivo nuevo: se guarda local SIN publicar (no pisa la rutina de la familia)
      guardarConfiguracionRutina(CONFIGURACION_DEFAULT, false);
      if (ultimaBasePublicada === null) ultimaBasePublicada = claveBase(CONFIGURACION_DEFAULT);
      return CONFIGURACION_DEFAULT;
    }
    const parsed = JSON.parse(raw);
    // Garantizar que tenga las propiedades mínimas
    if (!parsed || !Array.isArray(parsed.etapas)) {
      return CONFIGURACION_DEFAULT;
    }
    const config: ConfiguracionRutina = {
      ...CONFIGURACION_DEFAULT,
      ...parsed,
      etapas: parsed.etapas.length > 0 ? parsed.etapas : CONFIGURACION_DEFAULT.etapas,
    };
    if (ultimaBasePublicada === null) ultimaBasePublicada = claveBase(config);
    return config;
  } catch (err) {
    console.error("[StorageRutina] Error al leer configuración:", err);
    return CONFIGURACION_DEFAULT;
  }
}

function publicarBase(config: ConfiguracionRutina): void {
  const base = claveBase(config);
  if (base === ultimaBasePublicada) return;
  ultimaBasePublicada = base;
  fetch("/api/rutina", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ etapas: config.etapas, semanalConfig: config.semanalConfig }),
  }).catch(() => {
    // Sin red: el dispositivo ya guardó en localStorage; se reintenta en el próximo cambio
    ultimaBasePublicada = null;
  });
}

/**
 * Guarda la configuración en localStorage, notifica a los componentes y, si cambió la rutina base, la publica.
 * `publicar = false` solo guarda local (lectura inicial y sincronización desde el servidor).
 */
export function guardarConfiguracionRutina(config: ConfiguracionRutina, publicar = true): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Disparar evento para que otras pestañas o componentes se actualicen reactivamente
    window.dispatchEvent(new CustomEvent("rutina-actualizada", { detail: config }));
    if (publicar) publicarBase(config);
  } catch (err) {
    console.error("[StorageRutina] Error al guardar configuración:", err);
  }
}

// Una sola sincronización a la vez: si la pantalla se monta dos veces seguidas, la segunda llamada espera
// a la primera en lugar de ver la base vacía y publicar de nuevo (vault LANE_259, D7).
let sincronizando: Promise<void> | null = null;

/**
 * Trae la rutina base de la familia y la aplica en este dispositivo si cambió.
 * Si el servidor todavía no tiene ninguna y quien abre es padre/madre, publica la de este dispositivo (vault LANE_259, D3).
 */
export function sincronizarDesdeServidor(esPadre: boolean): Promise<void> {
  if (!sincronizando) {
    sincronizando = sincronizarUnaVez(esPadre).finally(() => {
      sincronizando = null;
    });
  }
  return sincronizando;
}

async function sincronizarUnaVez(esPadre: boolean): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/rutina", { cache: "no-store" });
    if (!res.ok) return;
    const remoto = await res.json();
    const local = obtenerConfiguracionRutina();
    if (!remoto?.guardada) {
      if (esPadre) {
        ultimaBasePublicada = null;
        publicarBase(local);
      }
      return;
    }
    if (!Array.isArray(remoto.etapas) || remoto.etapas.length === 0) return;
    const next: ConfiguracionRutina = {
      ...local,
      etapas: remoto.etapas,
      semanalConfig: remoto.semanalConfig ?? local.semanalConfig,
    };
    const base = claveBase(next);
    ultimaBasePublicada = base;
    if (base === claveBase(local)) return;
    // La rutina base cambió: el ajuste de hoy deja de valer (mismo criterio que el editor)
    guardarConfiguracionRutina({ ...next, ajusteDia: null }, false);
  } catch {
    // Sin red: se sigue con la copia local
  }
}

/**
 * Restablece la rutina y metas a la versión oficial predeterminada.
 */
export function restablecerRutinaDefault(): ConfiguracionRutina {
  guardarConfiguracionRutina(CONFIGURACION_DEFAULT);
  return CONFIGURACION_DEFAULT;
}
