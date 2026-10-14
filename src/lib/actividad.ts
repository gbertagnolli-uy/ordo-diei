// Detector de inactividad (N4): núcleo puro y sin DOM, con reloj inyectable para las pruebas.
// Spec: vault/nuevas-features/sesion-inactividad-borradores/SPEC.md §2. Sin cambios visibles: lo consumen
// useInactividad (hook) y, más adelante, GuardiaInactividad (N6) y la pantalla de reposo (R3).

// ---------------------------------------------------------------- constantes (SPEC §2)

/** Eventos del navegador que cuentan como actividad (se escuchan en `window`, en captura y pasivos). */
export const EVENTOS_ACTIVIDAD = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "touchstart",
  "touchmove",
  "scroll",
  "focusin",
] as const;

/** Un movimiento del puntero cuenta solo si se desplazó al menos esto (ignora la vibración). */
export const UMBRAL_MOVIMIENTO_PX = 4;
/** Máximo de eventos de actividad registrados: uno cada tanto. */
export const LIMITE_EVENTOS_MS = 500;
export const NOMBRE_CANAL = "ordo-actividad";
export const CLAVE_ULTIMA_ACTIVIDAD = "ultimaActividad";

// ---------------------------------------------------------------- reloj

export type Temporizador = unknown;

export interface Reloj {
  ahora(): number;
  setTimeout(fn: () => void, ms: number): Temporizador;
  clearTimeout(t: Temporizador): void;
}

export const relojReal: Reloj = {
  ahora: () => Date.now(),
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (t) => globalThis.clearTimeout(t as ReturnType<typeof setTimeout>),
};

// ---------------------------------------------------------------- filtros de eventos (puros)

export function esMovimientoReal(
  anterior: { x: number; y: number } | null,
  actual: { x: number; y: number },
  umbral = UMBRAL_MOVIMIENTO_PX,
): boolean {
  if (!anterior) return true;
  return Math.hypot(actual.x - anterior.x, actual.y - anterior.y) >= umbral;
}

/** Deja pasar como mucho un evento por ventana (`LIMITE_EVENTOS_MS`). */
export function crearLimitador(reloj: Reloj, ventanaMs = LIMITE_EVENTOS_MS): () => boolean {
  let ultimo = -Infinity;
  return () => {
    const t = reloj.ahora();
    if (t - ultimo < ventanaMs) return false;
    ultimo = t;
    return true;
  };
}

// ---------------------------------------------------------------- exenciones (SPEC §2: useMantenerActivo)

type Oyente = () => void;

/**
 * Registro de motivos que suspenden el contador de sesión (video/lección, temporizador a pantalla completa,
 * rezo guiado, subida de archivo, apertura de sobre…). Es global: cualquier componente se registra sin conocer
 * al monitor, que se suscribe a los cambios.
 */
export function crearRegistroExenciones() {
  const cuentas = new Map<string, number>();
  const oyentes = new Set<Oyente>();
  const avisar = () => oyentes.forEach((f) => f());
  return {
    /** Registra un motivo; devuelve `liberar` (idempotente). Varios registros del mismo motivo se cuentan. */
    mantenerActivo(motivo: string): () => void {
      cuentas.set(motivo, (cuentas.get(motivo) ?? 0) + 1);
      avisar();
      let liberado = false;
      return () => {
        if (liberado) return;
        liberado = true;
        const n = (cuentas.get(motivo) ?? 1) - 1;
        if (n <= 0) cuentas.delete(motivo);
        else cuentas.set(motivo, n);
        avisar();
      };
    },
    hayExenciones: () => cuentas.size > 0,
    motivos: () => [...cuentas.keys()],
    suscribir(f: Oyente): () => void {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
  };
}

export type RegistroExenciones = ReturnType<typeof crearRegistroExenciones>;

/** Registro global de la aplicación (lo usan `useMantenerActivo` y `useInactividad`). */
export const exenciones: RegistroExenciones = crearRegistroExenciones();
export const mantenerActivo = (motivo: string) => exenciones.mantenerActivo(motivo);

// ---------------------------------------------------------------- canal entre pestañas (SPEC §2.2)

export type MensajeCanal = { t: "actividad"; ts: number } | { t: "cerrar" };

export interface Canal {
  publicar(m: MensajeCanal): void;
  suscribir(f: (m: MensajeCanal) => void): () => void;
  /** Libera el canal (cierra el `BroadcastChannel`). */
  cerrar?(): void;
}

/** Canal real: `BroadcastChannel("ordo-actividad")` + `localStorage.ultimaActividad` como respaldo. Sin ninguno, no comparte. */
export function crearCanalNavegador(): Canal {
  const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(NOMBRE_CANAL) : null;
  return {
    publicar(m) {
      try {
        bc?.postMessage(m);
      } catch {
        /* canal cerrado */
      }
      if (m.t === "actividad") {
        try {
          localStorage.setItem(CLAVE_ULTIMA_ACTIVIDAD, String(m.ts));
        } catch {
          /* almacenamiento bloqueado */
        }
      }
    },
    suscribir(f) {
      const alMensaje = (e: MessageEvent) => {
        const d = e.data as MensajeCanal | undefined;
        if (d && (d.t === "actividad" || d.t === "cerrar")) f(d);
      };
      const alStorage = (e: StorageEvent) => {
        if (e.key === CLAVE_ULTIMA_ACTIVIDAD && e.newValue) f({ t: "actividad", ts: Number(e.newValue) || Date.now() });
      };
      bc?.addEventListener("message", alMensaje);
      if (typeof window !== "undefined") window.addEventListener("storage", alStorage);
      return () => {
        bc?.removeEventListener("message", alMensaje);
        if (typeof window !== "undefined") window.removeEventListener("storage", alStorage);
      };
    },
    cerrar() {
      bc?.close();
    },
  };
}

// ---------------------------------------------------------------- monitor

export type OpcionesMonitor = {
  /** Milisegundos sin actividad para vencer (60 000 con sesión, 15 000 en el login). */
  umbralMs: number;
  /** Aviso previo: se dispara a `umbralMs - avisoMs` (SPEC §2.1: 10 s antes). */
  avisoMs?: number;
  alVencer: () => void;
  alAvisar?: () => void;
  /** Cada vez que cambia el estado (corriendo, avisado, suspendido, vencido): para reflejarlo en la interfaz. */
  alCambiar?: (estado: EstadoMonitor) => void;
  reloj?: Reloj;
  canal?: Canal | null;
  registro?: RegistroExenciones;
};

export type EstadoMonitor = "corriendo" | "avisado" | "vencido" | "suspendido" | "detenido";

/**
 * Cuenta el tiempo sin actividad. `actividad()` lo reinicia; mientras haya exenciones registradas no corre y,
 * al liberarse la última, la cuenta arranca de cero. La actividad de otra pestaña también lo reinicia; al vencer
 * una pestaña avisa `cerrar` a las demás.
 */
export function crearMonitorInactividad(op: OpcionesMonitor) {
  const reloj = op.reloj ?? relojReal;
  const registro = op.registro ?? exenciones;
  let ultimaActividad = reloj.ahora();
  let timerAviso: Temporizador | null = null;
  let timerVence: Temporizador | null = null;
  let estado: EstadoMonitor = "detenido";
  let bajas: (() => void)[] = [];
  const poner = (nuevo: EstadoMonitor) => {
    if (estado === nuevo) return;
    estado = nuevo;
    op.alCambiar?.(nuevo);
  };

  const limpiar = () => {
    if (timerAviso !== null) reloj.clearTimeout(timerAviso);
    if (timerVence !== null) reloj.clearTimeout(timerVence);
    timerAviso = timerVence = null;
  };

  const vencer = (propagar: boolean) => {
    if (estado === "vencido" || estado === "detenido") return;
    limpiar();
    poner("vencido");
    if (propagar) op.canal?.publicar({ t: "cerrar" });
    op.alVencer();
  };

  const programar = () => {
    limpiar();
    if (estado === "detenido" || estado === "vencido") return;
    if (registro.hayExenciones()) {
      poner("suspendido");
      return;
    }
    poner("corriendo");
    const restante = ultimaActividad + op.umbralMs - reloj.ahora();
    if (restante <= 0) return vencer(true);
    if (op.avisoMs && op.avisoMs < op.umbralMs) {
      const hastaAviso = restante - op.avisoMs;
      if (hastaAviso > 0) {
        timerAviso = reloj.setTimeout(() => {
          timerAviso = null;
          if (estado === "corriendo") {
            poner("avisado");
            op.alAvisar?.();
          }
        }, hastaAviso);
      } else {
        poner("avisado");
        op.alAvisar?.();
      }
    }
    timerVence = reloj.setTimeout(() => {
      timerVence = null;
      vencer(true);
    }, restante);
  };

  const registrar = (ts: number, remota: boolean) => {
    if (estado === "detenido" || estado === "vencido") return;
    ultimaActividad = Math.max(ultimaActividad, ts);
    if (!remota) op.canal?.publicar({ t: "actividad", ts });
    programar();
  };

  return {
    iniciar() {
      if (estado !== "detenido") return;
      estado = "corriendo";
      op.alCambiar?.("corriendo");
      ultimaActividad = reloj.ahora();
      bajas = [
        registro.suscribir(() => {
          if (estado === "detenido" || estado === "vencido") return;
          // al liberarse la última exención «se reinicia la cuenta» (SPEC §6.6)
          if (!registro.hayExenciones()) ultimaActividad = reloj.ahora();
          programar();
        }),
        ...(op.canal
          ? [
              op.canal.suscribir((m) => {
                if (m.t === "actividad") registrar(m.ts, true);
                else vencer(false);
              }),
            ]
          : []),
      ];
      programar();
    },
    detener() {
      limpiar();
      bajas.forEach((b) => b());
      bajas = [];
      op.canal?.cerrar?.();
      poner("detenido");
    },
    /** Actividad local (un evento del usuario). */
    actividad() {
      registrar(reloj.ahora(), false);
    },
    /**
     * Para cuando la pestaña vuelve de una suspensión (`visibilitychange`/`pageshow`): si ya pasó el umbral vence
     * al instante, antes de mostrar nada.
     */
    revisar() {
      if (estado === "detenido" || estado === "vencido") return;
      if (!registro.hayExenciones() && reloj.ahora() - ultimaActividad >= op.umbralMs) vencer(true);
      else programar();
    },
    /** Empieza de nuevo (p. ej. tras volver al selector). */
    reiniciar() {
      if (estado === "detenido") return;
      poner("corriendo");
      ultimaActividad = reloj.ahora();
      programar();
    },
    estado: () => estado,
    restanteMs: () => (estado === "detenido" ? op.umbralMs : Math.max(0, ultimaActividad + op.umbralMs - reloj.ahora())),
  };
}

export type MonitorInactividad = ReturnType<typeof crearMonitorInactividad>;
