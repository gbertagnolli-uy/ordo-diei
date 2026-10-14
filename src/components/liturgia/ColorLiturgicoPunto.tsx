import { infoColor } from "@/lib/liturgia/colores";
import { cn } from "@/lib/utils";

/** Punto del color litúrgico (blanco con borde dorado, negro con contorno…). */
export function ColorLiturgicoPunto({ color, className }: { color: string; className?: string }) {
  const c = infoColor(color);
  return (
    <span
      role="img"
      aria-label={`Color litúrgico: ${c.etiqueta}`}
      title={c.etiqueta}
      className={cn("inline-block size-3 shrink-0 rounded-full border", className)}
      style={{ backgroundColor: c.hex, borderColor: c.borde }}
    />
  );
}
