"use client";

// Tira de los últimos días: un cuadrito por día, coloreado según el nivel (gris si no hay registro).
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { etiquetaConducta } from "@/lib/conducta/niveles";
import { useThemeStore } from "@/store/themeStore";
import type { DiaConducta } from "@/lib/conducta/server";
import { COLORES_CONDUCTA } from "./colores";

export function TiraConducta({ registros, hasta, dias = 14 }: { registros: DiaConducta[]; hasta: string; dias?: number }) {
  const darkMode = useThemeStore((st) => st.darkMode);
  const paleta = COLORES_CONDUCTA[darkMode ? "oscuro" : "claro"];
  const porDia = new Map(registros.map((r) => [r.fecha, r]));
  const fin = parseISO(hasta);
  const lista = Array.from({ length: dias }, (_, i) => format(addDays(fin, i - (dias - 1)), "yyyy-MM-dd"));

  return (
    <ul className="flex gap-1" aria-label={`Conducta de los últimos ${dias} días`}>
      {lista.map((d) => {
        const r = porDia.get(d);
        const texto = format(parseISO(d), "EEE d MMM", { locale: es });
        return (
          <li
            key={d}
            title={r ? `${texto}: ${etiquetaConducta(r.nivel)}${r.nota ? ` — ${r.nota}` : ""}` : `${texto}: sin registro`}
            className="h-8 min-w-0 flex-1 rounded-sm bg-muted"
            style={r ? { backgroundColor: paleta[r.nivel - 1] } : undefined}
          >
            <span className="sr-only">{r ? `${texto}: ${etiquetaConducta(r.nivel)}` : `${texto}: sin registro`}</span>
          </li>
        );
      })}
    </ul>
  );
}
