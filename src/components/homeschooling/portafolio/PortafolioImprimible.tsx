"use client";

// Propio de Ordo (lane 193, K3): el portafolio para la carpeta de la casa — portada con el alumno y el rango, y cada trabajo aprobado
// con su foto, fecha, materia, estrellas y comentario. Dos por fila, A4. Sin valor legal: es el registro de lo que se hizo.
import { useState } from "react";
import { Printer, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tituloDeRango } from "@/lib/homeschooling/portafolioImpreso";
import type { ShowcaseWithDetails } from "@/lib/homeschooling/roost/tipos";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function PortafolioImprimible({ evidencias, alumno, desde, hasta, materia }: { evidencias: ShowcaseWithDetails[]; alumno: string; desde: string | null; hasta: string | null; materia: string | null }) {
  const [d, setD] = useState(desde ?? "");
  const [h, setH] = useState(hasta ?? "");
  const aplicar = () => {
    const q = new URLSearchParams(window.location.search);
    if (d) q.set("desde", d);
    else q.delete("desde");
    if (h) q.set("hasta", h);
    else q.delete("hasta");
    window.location.search = q.toString();
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-5 p-4 sm:p-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3 print:hidden">
        <div className="space-y-1">
          <Label htmlFor="imp-desde">Desde</Label>
          <Input id="imp-desde" type="date" value={d} onChange={(e) => setD(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="imp-hasta">Hasta</Label>
          <Input id="imp-hasta" type="date" value={h} onChange={(e) => setH(e.target.value)} />
        </div>
        <Button variant="outline" onClick={aplicar}>
          Aplicar
        </Button>
        <Button className="ml-auto" onClick={() => window.print()} disabled={evidencias.length === 0}>
          <Printer /> Imprimir portafolio
        </Button>
      </div>

      <header className="space-y-1 border-b-2 border-foreground pb-3 print:border-black print:text-black">
        <p className="text-xs tracking-widest uppercase">Portafolio de estudio</p>
        <h1 className="text-3xl font-bold">{alumno}</h1>
        <p className="text-sm">
          {materia ? `${materia} · ` : ""}
          {tituloDeRango(desde, hasta)} · {evidencias.length} {evidencias.length === 1 ? "trabajo" : "trabajos"}
        </p>
      </header>

      {evidencias.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground print:text-black">No hay trabajos aprobados en este rango.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-3">
          {evidencias.map((e) => (
            <article key={e.id} className="sin-corte space-y-2 overflow-hidden rounded-xl border p-3 print:rounded-none print:border-black print:text-black">
              {e.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.images[0].image_url} alt="" className="aspect-4/3 w-full rounded-lg object-cover print:rounded-none" />
              )}
              <h2 className="font-semibold">{e.title || "Sin título"}</h2>
              <p className="text-xs text-muted-foreground print:text-black">
                {e.materia_name ? `${e.materia_name} · ` : ""}
                {FECHA.format(new Date(e.created_at))}
                {e.images.length > 1 ? ` · ${e.images.length} fotos` : ""}
              </p>
              {e.stars ? (
                <p className="flex gap-0.5 text-warning print:text-black" aria-label={`${e.stars} estrellas`}>
                  {Array.from({ length: e.stars }, (_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </p>
              ) : null}
              {e.description && <p className="text-sm whitespace-pre-wrap">{e.description}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
