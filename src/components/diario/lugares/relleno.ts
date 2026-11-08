"use client";
// Diario (lane 296): relleno automático de lugar y clima en las entradas nuevas. Portado de las preferencias `autoNearestPlace`, `autoPosition` y `autoWeather`
// de moodiary (vendor/moodiary/.../moodiary_editor/lib/src/application/edit_controller.dart, ZhuJHua/moodiary@2c552dd); las tres arrancan apagadas.
// Se guardan en este dispositivo (localStorage): el permiso de ubicación también es del dispositivo.
import { useEffect, useRef } from "react";
import { lugarCercano, type Coordenadas } from "@/lib/diario/lugares";
import type { Clima } from "@/lib/diario/clima";
import type { LugarVista } from "@/lib/diario/servidor-lugares";
import { usePreferencia } from "../estadisticas/controles";
import { obtenerClima, obtenerUbicacion, tengoPermisoDeUbicacion } from "./ubicacion";
import type { AccionesLugares } from "./useLugares";

export interface OpcionesRelleno {
  /** Pone el lugar guardado que esté a 200 m (no crea ninguno). */
  lugarCercano: boolean;
  /** Pone el lugar de la ubicación, creándolo con el nombre de la dirección si hace falta. */
  lugarDeUbicacion: boolean;
  /** Pone el clima de ahora. */
  clima: boolean;
}

export const OPCIONES_RELLENO: OpcionesRelleno = { lugarCercano: false, lugarDeUbicacion: false, clima: false };

export const esOpcionesRelleno = (v: unknown): v is OpcionesRelleno =>
  typeof v === "object" && v !== null && (["lugarCercano", "lugarDeUbicacion", "clima"] as const).every((k) => typeof (v as Record<string, unknown>)[k] === "boolean");

export const usePreferenciasRelleno = () => usePreferencia("diario.relleno", OPCIONES_RELLENO, esOpcionesRelleno);

/**
 * Rellena el lugar y el clima de una entrada nueva, una sola vez, con la ubicación reciente (moodiary `onlyIfUnset`: lo que el usuario ya puso no se pisa).
 * Si el navegador no da la ubicación, no pasa nada: la entrada queda como estaba.
 */
export function useRellenoAutomatico({
  activo,
  opciones,
  lugares,
  lugarActual,
  climaActual,
  onLugar,
  onClima,
}: {
  /** Solo en entradas nuevas. */
  activo: boolean;
  opciones: OpcionesRelleno;
  lugares: AccionesLugares;
  /** Lo que tiene la entrada ahora (se lee al terminar la consulta, no al empezar). */
  lugarActual: () => number | null;
  climaActual: () => Clima | null;
  onLugar: (id: number) => void;
  onClima: (c: Clima) => void;
}) {
  const hecho = useRef(false);
  // Siempre las últimas funciones, sin volver a disparar el efecto
  const ultimo = useRef({ lugares, lugarActual, climaActual, onLugar, onClima });
  useEffect(() => {
    ultimo.current = { lugares, lugarActual, climaActual, onLugar, onClima };
  });

  useEffect(() => {
    if (!activo || hecho.current || !(opciones.lugarCercano || opciones.lugarDeUbicacion || opciones.clima)) return;
    hecho.current = true;
    let vivo = true;
    void (async () => {
      // Sin el permiso ya dado no se pregunta: una entrada nueva no tiene que abrir un aviso del navegador por sí sola
      if (!(await tengoPermisoDeUbicacion())) return;
      let punto: Coordenadas;
      try {
        punto = await obtenerUbicacion(false);
      } catch {
        return;
      }
      if (!vivo) return;
      if (opciones.lugarDeUbicacion) {
        const lugar = await ultimo.current.lugares.deUbicacion(punto.latitud, punto.longitud);
        if (vivo && lugar && ultimo.current.lugarActual() === null) ultimo.current.onLugar(lugar.id);
      } else if (opciones.lugarCercano) {
        const cerca = lugarCercano<LugarVista>(await listaActual(ultimo.current.lugares), punto.latitud, punto.longitud);
        if (vivo && cerca && ultimo.current.lugarActual() === null) ultimo.current.onLugar(cerca.id);
      }
      if (opciones.clima) {
        try {
          const clima = await obtenerClima(punto);
          if (vivo && ultimo.current.climaActual() === null) ultimo.current.onClima(clima);
        } catch {
          /* el servicio no respondió: la entrada queda sin clima */
        }
      }
    })();
    return () => {
      vivo = false;
    };
  }, [activo, opciones]);
}

/** La lista de lugares al día (la del hook puede no haber cargado todavía). */
async function listaActual(lugares: AccionesLugares): Promise<LugarVista[]> {
  if (lugares.lista) return lugares.lista;
  try {
    const r = await fetch(`/api/diario/lugares?tipo=${lugares.tipo}`);
    const d = await r.json().catch(() => ({}));
    return r.ok ? (d.lugares as LugarVista[]) : [];
  } catch {
    return [];
  }
}
