"use client";

// Tarjeta de la Tienda: el arte vende, el precio siempre se ve y la tarjeta entera es el botón (SPEC §9.2).
import { Check, Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductoVista } from "@/lib/tienda/server";
import { ArteProducto } from "./ArteProducto";
import { Precio, textoFaltan } from "./Moneda";

/** El requisito más cercano de cumplir: el que tiene más avance entre los pendientes */
function requisitoPendiente(p: ProductoVista) {
  return p.requisitos.filter((r) => !r.cumplido).sort((a, b) => b.actual / b.objetivo - a.actual / a.objetivo)[0];
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-UY", { day: "numeric", month: "short" });
}

export function TarjetaProducto({
  p,
  onAbrir,
  className,
}: {
  p: ProductoVista;
  onAbrir: (p: ProductoVista) => void;
  className?: string;
}) {
  const bloqueado = p.estado === "bloqueado";
  const apagado = bloqueado || p.estado === "agotado" || p.estado === "proximamente";
  const opcion = p.opciones[p.opcionSugerida >= 0 ? p.opcionSugerida : 0];
  const pendiente = bloqueado ? requisitoPendiente(p) : undefined;
  const quedan = p.stockRestante !== null && p.stockRestante > 0 && p.stockRestante <= 5 ? p.stockRestante : null;

  let pie: React.ReactNode = null;
  if (bloqueado && pendiente) pie = <span className="flex items-center gap-1"><Lock className="size-3" />{pendiente.texto}</span>;
  else if (p.estado === "agotado") pie = "Agotado";
  else if (p.estado === "proximamente" && p.disponibleDesde) pie = `Desde el ${fechaCorta(p.disponibleDesde)}`;
  else if (p.estado === "limite") pie = <span className="flex items-center gap-1"><Check className="size-3" />{p.limite?.proximaCompra ? `Otra vez el ${fechaCorta(p.limite.proximaCompra)}` : "Ya lo tenés"}</span>;
  else if (p.estado === "sinSaldo" && opcion) pie = `Te faltan ${textoFaltan(opcion.faltan)}`;

  return (
    <button
      type="button"
      onClick={() => onAbrir(p)}
      className={cn(
        "group flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card text-left text-card-foreground shadow-xs transition",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        p.estado === "comprable" && p.destacado && "border-primary/50",
        className
      )}
      aria-label={`${p.titulo}${bloqueado ? ". Bloqueado" : ""}${p.estado === "agotado" ? ". Agotado" : ""}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <div className={cn("size-full transition duration-300 group-hover:scale-105", apagado && "grayscale")}>
          <ArteProducto p={p} />
        </div>
        {bloqueado && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white">
              <Lock className="size-6" aria-hidden />
            </span>
          </div>
        )}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1">
          {p.esMeta ? (
            <Badge className="gap-1 bg-amber-500 text-amber-950"><Star className="size-3 fill-current" />Mi meta</Badge>
          ) : (
            <span />
          )}
          {quedan !== null && <Badge variant="destructive">{quedan === 1 ? "¡Último!" : `Quedan ${quedan}`}</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-heading text-sm leading-tight font-semibold sm:text-base">{p.titulo}</h3>
        {opcion && <Precio costos={opcion.costos} className={cn("text-sm sm:text-base", apagado && "text-muted-foreground")} />}
        {p.opciones.length > 1 && <span className="text-[11px] text-muted-foreground">+{p.opciones.length - 1} {p.opciones.length === 2 ? "forma" : "formas"} de pagar</span>}
        {pie && <span className={cn("mt-auto pt-1 text-xs", p.estado === "sinSaldo" ? "text-destructive" : "text-muted-foreground")}>{pie}</span>}
      </div>
    </button>
  );
}
