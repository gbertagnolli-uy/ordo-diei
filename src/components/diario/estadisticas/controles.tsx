"use client";
// Diario (lane 287): controles chicos que comparten las pantallas de estadísticas: botones segmentados (Daily You `ConnectedButtonGroup`,
// moodiary `MSegmentedControl`) y una preferencia recordada en el navegador (Daily You `ConfigProvider`: rango, sujeto, agrupación, suavizado).
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Segmentos<T extends string>({ opciones, valor, onCambio, etiqueta, className }: { opciones: { valor: T; titulo: string }[]; valor: T; onCambio: (v: T) => void; etiqueta: string; className?: string }) {
  return (
    <div role="group" aria-label={etiqueta} className={cn("inline-flex overflow-hidden rounded-lg border", className)}>
      {opciones.map((o, i) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={o.valor === valor}
          onClick={() => onCambio(o.valor)}
          className={cn("px-3 py-1.5 text-sm transition", i > 0 && "border-l", o.valor === valor ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
        >
          {o.titulo}
        </button>
      ))}
    </div>
  );
}

/** Valor guardado en `localStorage` (solo para comodidades de cada persona; si no hay almacenamiento queda en la sesión). */
export function usePreferencia<T>(clave: string, defecto: T, valido: (v: unknown) => v is T): [T, (v: T) => void] {
  const [valor, setValor] = useState<T>(defecto);
  useEffect(() => {
    try {
      const crudo = localStorage.getItem(clave);
      if (crudo === null) return;
      const leido: unknown = JSON.parse(crudo);
      // Se lee después de montar (no en el estado inicial) para que el servidor y el navegador dibujen lo mismo
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única al montar
      if (valido(leido)) setValor(leido);
    } catch {
      /* sin almacenamiento o valor roto: queda el predeterminado */
    }
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps -- `valido` es estable por uso
  const cambiar = useCallback(
    (v: T) => {
      setValor(v);
      try {
        localStorage.setItem(clave, JSON.stringify(v));
      } catch {
        /* queda solo en esta sesión */
      }
    },
    [clave],
  );
  return [valor, cambiar];
}

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Daily You `_formatLabel`: la marca del eje X según cuántos días abarca la serie. */
export function marcaDeFecha(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  if (dias <= 35) return `${d} ${MESES_CORTOS[m - 1]}`;
  if (dias <= 366) return MESES_CORTOS[m - 1];
  if (dias < 3 * 366) return `${MESES_CORTOS[m - 1]} '${String(a).slice(2)}`;
  return String(a);
}

export const fechaLarga = (fecha: string): string => {
  const [a, m, d] = fecha.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
};
