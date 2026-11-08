"use client";
// Diario (lane 284): chip de una etiqueta. Portado de vendor/Daily_You/lib/widgets/tag_chip.dart (Demizo/Daily_You@7cc237d):
// borde y fondo suave del color de la etiqueta, ícono, nombre y, en los contadores, el valor.
import { Hash, Tag, TrendingUp, X } from "lucide-react";
import type { EtiquetaVista } from "@/lib/diario/servidor-catalogo";
import { cn } from "@/lib/utils";
import { fondoSuave } from "./colores";
import { IconoEtiqueta } from "./iconos";

export function ChipEtiqueta({
  etiqueta,
  valor,
  onClick,
  onQuitar,
  pequeno,
}: {
  etiqueta: Pick<EtiquetaVista, "nombre" | "icono" | "tipoIcono" | "color" | "tipo">;
  valor?: string | null;
  onClick?: () => void;
  onQuitar?: () => void;
  pequeno?: boolean;
}) {
  const color = etiqueta.color ?? "var(--primary)";
  const contenido = (
    <>
      <IconoEtiqueta icono={etiqueta.icono} tipoIcono={etiqueta.tipoIcono} reemplazo={etiqueta.tipo === "contador" ? TrendingUp : Tag} color={etiqueta.color} tamano={pequeno ? 13 : 16} />
      <span className="min-w-0 truncate">{etiqueta.nombre}</span>
      {etiqueta.tipo === "contador" ? (
        <span className="rounded-md bg-background px-1.5 py-0.5 text-xs leading-none font-semibold">{valor ?? <Hash aria-label="sin valor" className="size-3 opacity-60" />}</span>
      ) : valor ? (
        <span className="font-medium">{valor}</span>
      ) : null}
    </>
  );
  const clases = cn("inline-flex max-w-full items-center gap-1 rounded-2xl border-[1.5px] px-2 py-1", pequeno ? "text-xs" : "text-[13px]");
  const estilo = { borderColor: color, backgroundColor: etiqueta.color ? fondoSuave(etiqueta.color) : "color-mix(in oklch, var(--primary) 12%, transparent)" };
  return (
    <span className="inline-flex max-w-full items-center gap-0.5">
      {onClick ? (
        <button type="button" onClick={onClick} className={cn(clases, "cursor-pointer text-left")} style={estilo}>
          {contenido}
        </button>
      ) : (
        <span className={clases} style={estilo}>
          {contenido}
        </span>
      )}
      {onQuitar && (
        <button type="button" onClick={onQuitar} aria-label={`Quitar ${etiqueta.nombre}`} className="-ml-1 rounded-full bg-background p-0.5 shadow-sm">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
