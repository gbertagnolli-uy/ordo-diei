"use client";
// Diario (lane 289): pide los recuerdos del día. «Un buen día» y «Un día aleatorio» se eligen una sola vez por día: lo elegido se guarda en el navegador
// y se manda de vuelta, así no cambian cada vez que se guarda otra entrada (Daily You `FlashbackManager`, que los guarda en `Settings`).
import { useEffect, useState } from "react";
import { CLAVES_RECUERDO, type EleccionesDelDia, type OpcionesRecuerdos } from "@/lib/diario/recuerdos";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { RecuerdosVista } from "@/lib/diario/servidor-linea";

const clave = (tipo: TipoDiario) => `diario.recuerdos.elegidos.${tipo}`;

function leerElegidos(tipo: TipoDiario): EleccionesDelDia | null {
  try {
    const crudo = localStorage.getItem(clave(tipo));
    const v = crudo ? (JSON.parse(crudo) as Partial<EleccionesDelDia>) : null;
    return v && typeof v.fecha === "string" ? { fecha: v.fecha, bueno: typeof v.bueno === "number" ? v.bueno : null, azar: typeof v.azar === "number" ? v.azar : null } : null;
  } catch {
    return null;
  }
}

function guardarElegidos(tipo: TipoDiario, e: EleccionesDelDia) {
  try {
    localStorage.setItem(clave(tipo), JSON.stringify(e));
  } catch {
    /* sin almacenamiento: se vuelve a elegir al recargar */
  }
}

/** `null` mientras carga, si están apagados o si falló (los recuerdos son un extra: el diario sigue funcionando sin ellos). */
export function useRecuerdos(tipo: TipoDiario, opciones: OpcionesRecuerdos, version: number): RecuerdosVista | null {
  const [datos, setDatos] = useState<RecuerdosVista | null>(null);
  const activos = CLAVES_RECUERDO.filter((c) => opciones.activos[c]).join(",");
  const encendidos = opciones.mostrar && activos !== "";

  useEffect(() => {
    if (!encendidos) return;
    let vivo = true;
    const p = new URLSearchParams({ tipo, activos });
    if (opciones.sinMalos) p.set("sinMalos", "1");
    const fijos = leerElegidos(tipo);
    if (fijos) {
      p.set("fecha", fijos.fecha);
      if (fijos.bueno !== null) p.set("bueno", String(fijos.bueno));
      if (fijos.azar !== null) p.set("azar", String(fijos.azar));
    }
    fetch(`/api/diario/recuerdos?${p}`)
      .then(async (r) => {
        const d = (await r.json().catch(() => null)) as RecuerdosVista | null;
        if (!r.ok || !d || !vivo) return;
        guardarElegidos(tipo, d.elegidos);
        setDatos(d);
      })
      .catch(() => {
        /* sin recuerdos hoy */
      });
    return () => {
      vivo = false;
    };
  }, [tipo, activos, encendidos, opciones.sinMalos, version]);

  return encendidos ? datos : null;
}
