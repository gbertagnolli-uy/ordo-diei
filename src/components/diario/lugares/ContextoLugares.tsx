"use client";
// Diario (lane 296): los lugares del diario abierto, disponibles para cualquier tarjeta de entrada (la entrada solo trae el id del lugar).
// Mismo recurso que ProveedorEscala (EscalaAnimo.tsx).
import { createContext, useContext } from "react";
import { IconoClima, IconoDeLugar } from "./iconos";
import { textoClimaCompacto, type Clima } from "@/lib/diario/clima";
import type { LugarVista } from "@/lib/diario/servidor-lugares";

const Contexto = createContext<LugarVista[]>([]);
export const ProveedorLugares = Contexto.Provider;
export const useListaDeLugares = () => useContext(Contexto);

/** moodiary `feed_tile`: el clima (ícono y temperatura) y el lugar (pin y nombre) de una entrada, en una línea. No dibuja nada si no hay ninguno. */
export function ClimaYLugar({ clima, lugarId, className }: { clima: Clima | null; lugarId: number | null; className?: string }) {
  const lugares = useListaDeLugares();
  const lugar = lugarId === null ? null : lugares.find((l) => l.id === lugarId);
  if (!clima && !lugar) return null;
  return (
    <span className={className ?? "flex min-w-0 items-center gap-2 text-xs text-muted-foreground"}>
      {clima && (
        <span className="flex shrink-0 items-center gap-1" title={clima.texto}>
          <IconoClima codigo={clima.codigo} tamano={14} />
          <span>{textoClimaCompacto(clima)}</span>
        </span>
      )}
      {lugar && (
        <span className="flex min-w-0 items-center gap-1" title={lugar.nombre}>
          <IconoDeLugar icono={lugar.icono} tamano={14} />
          <span className="truncate">{lugar.nombre}</span>
        </span>
      )}
    </span>
  );
}
