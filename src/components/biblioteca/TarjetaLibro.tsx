"use client";
// Portado de vendor/homebranch-web/src/entities/book/ui/BookCard.tsx (lane 270, fase 2): Chakra → Tailwind.
// Portada 2:3 (o una tapa con título y autor si no hay o no carga), título en 2 líneas, autor en 1,
// y la barra de progreso si el libro se está leyendo.
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Headphones } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { LibroResumen } from "@/lib/biblioteca/servidor";

/** La tapa que se muestra cuando el libro no tiene portada (BookJacket de homebranch-web). */
function TapaSinPortada({ titulo, autor }: { titulo: string; autor: string | null }) {
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-md border bg-muted p-4 text-left">
      <p className="line-clamp-4 font-serif text-sm font-semibold leading-snug">{titulo}</p>
      {autor && <p className="line-clamp-2 text-xs text-muted-foreground">{autor}</p>}
    </div>
  );
}

export function TarjetaLibro({ libro, insignia }: { libro: LibroResumen; insignia?: ReactNode }) {
  const [portadaFallida, setPortadaFallida] = useState<string | null>(null);
  const portada = libro.portadaUrl;
  const href = `/dashboard/biblioteca/libro/${libro.id}`;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Link href={href} aria-label={`Ver ${libro.titulo}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-md">
          {portada && portadaFallida !== portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portada} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setPortadaFallida(portada)} />
          ) : (
            <TapaSinPortada titulo={libro.titulo} autor={libro.autor} />
          )}
          {libro.esAudiolibro && (
            <span className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow" aria-label="Audiolibro">
              <Headphones className="size-3.5" />
            </span>
          )}
          {insignia}
        </div>
      </Link>
      <div className="min-w-0">
        <Link href={href} className="flex min-h-11 items-center">
          <span className="line-clamp-2 font-medium">{libro.titulo}</span>
        </Link>
        {libro.autor && <p className="truncate text-sm text-muted-foreground">{libro.autor}</p>}
        {libro.estado === "leyendo" && (
          <Progress value={libro.porcentaje} className="mt-2 h-1" aria-label={`Leído ${Math.round(libro.porcentaje)} %`} />
        )}
      </div>
    </div>
  );
}

export function TarjetaLibroEsqueleto() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[2/3] rounded-md" />
      <div>
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-1 h-3.5 w-3/5" />
      </div>
    </div>
  );
}
