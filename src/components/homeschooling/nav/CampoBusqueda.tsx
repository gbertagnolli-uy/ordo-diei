"use client";

// Propio de Ordo (lane 187, S1b): el campo de búsqueda de las listas de Estudio (portafolio, revisión, lectura, memoria, actividades).
// Filtra en el momento; Escape lo vacía. Para buscar en todo Estudio está el buscador de la barra superior (⌘K).
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CampoBusqueda({ valor, onChange, placeholder = "Buscar…", etiqueta = "Buscar en esta lista", cantidad }: { valor: string; onChange: (v: string) => void; placeholder?: string; etiqueta?: string; cantidad?: number }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && valor && (e.stopPropagation(), onChange(""))}
        placeholder={placeholder}
        aria-label={etiqueta}
        className="pr-9 pl-9"
      />
      {valor && (
        <Button type="button" variant="ghost" size="icon-xs" className="absolute top-1/2 right-1.5 -translate-y-1/2" aria-label="Borrar la búsqueda" onClick={() => onChange("")}>
          <X />
        </Button>
      )}
      {valor && cantidad !== undefined && (
        <p className="mt-1 text-xs text-muted-foreground" role="status">
          {cantidad === 0 ? "Sin resultados" : `${cantidad} ${cantidad === 1 ? "resultado" : "resultados"}`}
        </p>
      )}
    </div>
  );
}
