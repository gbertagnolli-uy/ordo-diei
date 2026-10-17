"use client";

// Arte de un producto: su imagen o, si no tiene, un fondo con el ícono de su tipo.
import { Gift, Layers, Sparkles, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductoVista } from "@/lib/tienda/server";

const FONDOS: Record<string, string> = {
  "sobre:meditacion": "from-emerald-900 via-emerald-800 to-stone-950 text-emerald-300",
  "sobre:devocion": "from-sky-900 via-sky-800 to-stone-950 text-sky-300",
  "sobre:revelacion": "from-amber-800 via-amber-700 to-stone-950 text-amber-300",
  "sobre:gloria": "from-fuchsia-900 via-purple-800 to-stone-950 text-fuchsia-300",
};

export function ArteProducto({
  p,
  className,
}: {
  p: Pick<ProductoVista, "tipo" | "sistemaClave" | "imagenUrl" | "titulo">;
  className?: string;
}) {
  if (p.imagenUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.imagenUrl} alt="" className={cn("size-full object-cover", className)} loading="lazy" />;
  }
  const Icono = p.tipo === "sobre" ? Layers : p.tipo === "fragmentos" ? Sparkles : p.tipo === "vale" ? Ticket : Gift;
  const fondo = (p.sistemaClave && FONDOS[p.sistemaClave]) || (p.tipo === "vale" ? "from-rose-900 via-rose-800 to-stone-950 text-rose-300" : p.tipo === "fragmentos" ? "from-indigo-900 via-indigo-800 to-stone-950 text-indigo-300" : "from-primary/40 via-primary/25 to-card text-primary");
  return (
    <div aria-hidden className={cn("flex size-full items-center justify-center bg-gradient-to-br", fondo, className)}>
      <Icono className="size-1/3 opacity-90 drop-shadow" strokeWidth={1.5} />
    </div>
  );
}
