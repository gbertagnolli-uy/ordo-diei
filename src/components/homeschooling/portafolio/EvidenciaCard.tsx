"use client";

// Portado de vendor/roost/src/components/showcase/ShowcaseCard.tsx (msrbuilds/roost@492af47).
// Cambios: tarjeta de evidencia — foto, fecha, estrellas y materia (sin votos ni categoría); estado con
// SHOWCASE_STATUS_INFO; «Destacar» solo para padres; tokens de Ordo; sin <Link> (abre un Sheet).

import { Star } from "lucide-react";
import { SHOWCASE_STATUS_INFO, type ShowcaseWithDetails } from "@/lib/homeschooling/roost/tipos";

export default function EvidenciaCard({ evidencia, mostrarAlumno, onClick }: { evidencia: ShowcaseWithDetails; mostrarAlumno: boolean; onClick: (e: ShowcaseWithDetails) => void }) {
  const info = SHOWCASE_STATUS_INFO[evidencia.status];
  const foto = evidencia.images[0]?.image_url;
  const fecha = new Date(evidencia.created_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });

  return (
    <button type="button" onClick={() => onClick(evidencia)} className="overflow-hidden rounded-xl border bg-card text-left transition-colors hover:border-primary/50">
      <div className="relative aspect-4/3 bg-muted">
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={evidencia.title || "Evidencia"} className="size-full object-cover" />
        )}
        {evidencia.is_featured && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-xs font-medium text-[var(--on-warning)]">
            <Star className="size-3 fill-current" /> Destacada
          </span>
        )}
        <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${info.bgColor} ${info.color}`}>{info.label}</span>
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 font-semibold text-foreground">{evidencia.title || "Sin título"}</h3>
        <p className="text-xs text-muted-foreground">
          {mostrarAlumno && `${evidencia.author_name} · `}
          {evidencia.materia_name && `${evidencia.materia_name} · `}
          {fecha}
        </p>
        {evidencia.stars ? (
          <p className="flex gap-0.5 text-warning" aria-label={`${evidencia.stars} estrellas`}>
            {Array.from({ length: evidencia.stars }, (_, i) => (
              <Star key={i} className="size-4 fill-current" />
            ))}
          </p>
        ) : null}
      </div>
    </button>
  );
}
