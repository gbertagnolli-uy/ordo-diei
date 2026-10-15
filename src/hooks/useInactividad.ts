"use client"

import * as React from "react"
import {
  EVENTOS_ACTIVIDAD,
  crearCanalNavegador,
  crearLimitador,
  crearMonitorInactividad,
  esMovimientoReal,
  mantenerActivo,
  relojReal,
  type EstadoMonitor,
  type MonitorInactividad,
} from "@/lib/actividad"

export type OpcionesInactividad = {
  /** Milisegundos sin actividad para vencer: 60 000 con sesión, 15 000 en el login (D3/D4). */
  umbralMs: number
  /** Aviso previo (SPEC §2.1: 10 000 = 10 s antes). */
  avisoMs?: number
  alVencer: () => void
  alAvisar?: () => void
  /** Pasar `false` apaga el contador (p. ej. mientras se muestra el reposo). */
  habilitado?: boolean
  /** Comparte la actividad entre pestañas (BroadcastChannel + localStorage). Por defecto sí. */
  entrePestanas?: boolean
}

/**
 * Detecta la falta de actividad del usuario (SPEC sesion-inactividad-borradores §2). No muestra nada ni cierra
 * nada por sí mismo: avisa por `alAvisar` y `alVencer`. Los eventos que cuentan están en `EVENTOS_ACTIVIDAD`;
 * los componentes que no deben cortarse (video, temporizador, rezo…) usan `useMantenerActivo`.
 */
export function useInactividad({
  umbralMs,
  avisoMs,
  alVencer,
  alAvisar,
  habilitado = true,
  entrePestanas = true,
}: OpcionesInactividad) {
  const callbacks = React.useRef({ alVencer, alAvisar })
  React.useEffect(() => {
    callbacks.current = { alVencer, alAvisar }
  })

  const [estado, setEstado] = React.useState<EstadoMonitor>("detenido")
  const monitor = React.useRef<MonitorInactividad | null>(null)

  React.useEffect(() => {
    if (!habilitado) return
    const canal = entrePestanas ? crearCanalNavegador() : null
    const m = crearMonitorInactividad({
      umbralMs,
      avisoMs,
      canal,
      alCambiar: setEstado,
      alAvisar: () => callbacks.current.alAvisar?.(),
      alVencer: () => callbacks.current.alVencer(),
    })
    monitor.current = m
    m.iniciar()

    const pasa = crearLimitador(relojReal)
    let ultimoPuntero: { x: number; y: number } | null = null
    const alEvento = (e: Event) => {
      if (e.type === "pointermove") {
        const pe = e as PointerEvent
        const actual = { x: pe.clientX, y: pe.clientY }
        if (!esMovimientoReal(ultimoPuntero, actual)) return
        ultimoPuntero = actual
      }
      if (pasa()) m.actividad()
    }
    const alVolver = () => {
      if (document.visibilityState === "visible") m.revisar()
    }
    for (const nombre of EVENTOS_ACTIVIDAD) window.addEventListener(nombre, alEvento, { capture: true, passive: true })
    document.addEventListener("visibilitychange", alVolver)
    window.addEventListener("pageshow", alVolver)
    return () => {
      for (const nombre of EVENTOS_ACTIVIDAD) window.removeEventListener(nombre, alEvento, { capture: true })
      document.removeEventListener("visibilitychange", alVolver)
      window.removeEventListener("pageshow", alVolver)
      m.detener()
      monitor.current = null
    }
  }, [habilitado, umbralMs, avisoMs, entrePestanas])

  const reiniciar = React.useCallback(() => monitor.current?.reiniciar(), [])
  const restanteMs = React.useCallback(() => monitor.current?.restanteMs() ?? umbralMs, [umbralMs])
  return { estado, reiniciar, restanteMs }
}

/**
 * Mientras `activo` y el componente esté montado, el contador de inactividad de la sesión no corre
 * (reproducción de un video o lección, temporizador a pantalla completa, rezo guiado, subida de un archivo,
 * apertura de un sobre). Al terminar, la cuenta empieza de cero.
 */
export function useMantenerActivo(motivo: string, activo = true) {
  React.useEffect(() => {
    if (!activo) return
    return mantenerActivo(motivo)
  }, [motivo, activo])
}
