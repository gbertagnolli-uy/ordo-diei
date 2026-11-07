"use client";
// Portado de vendor/homebranch-web/src/features/library/components/{SearchLibrary,CollectionToolbar}.tsx
// (lane 270, fase 2): búsqueda + chips de filtro. Sin opciones de vista ni orden (spec de la fase 2).
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EstadoBiblioteca, FiltroBiblioteca } from "@/lib/biblioteca/reglas";
import type { EstanteVista } from "@/lib/biblioteca/servidor";

const ESTADOS: { valor: EstadoBiblioteca; texto: string }[] = [
  { valor: "sin_empezar", texto: "Sin empezar" },
  { valor: "leyendo", texto: "Leyendo" },
  { valor: "leido", texto: "Leídos" },
];

export function FiltrosBiblioteca({
  filtro,
  onCambio,
  estantes,
}: {
  filtro: FiltroBiblioteca;
  onCambio: (f: FiltroBiblioteca) => void;
  estantes: EstanteVista[];
}) {
  const texto = filtro.texto ?? "";
  return (
    <section aria-label="Filtros de la biblioteca" className="flex flex-wrap items-end gap-4 border-b py-3">
      <div className="flex min-w-full flex-1 flex-col gap-1.5 sm:min-w-60">
        <Label htmlFor="buscar-biblioteca">Buscar en la biblioteca</Label>
        <div className="flex w-full gap-2">
          <Input
            id="buscar-biblioteca"
            type="search"
            className="min-h-11"
            value={texto}
            placeholder="Título o autor"
            onChange={(e) => onCambio({ ...filtro, texto: e.currentTarget.value })}
          />
          {texto && (
            <Button variant="outline" className="min-h-11" onClick={() => onCambio({ ...filtro, texto: "" })}>
              Borrar
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={filtro.tipo ?? ""}
          onValueChange={(v) => onCambio({ ...filtro, tipo: v === "libros" || v === "audiolibros" ? v : null })}
          aria-label="Tipo"
        >
          <ToggleGroupItem value="libros">Libros</ToggleGroupItem>
          <ToggleGroupItem value="audiolibros">Audiolibros</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={filtro.estado ?? ""}
          onValueChange={(v) => onCambio({ ...filtro, estado: ESTADOS.find((e) => e.valor === v)?.valor ?? null })}
          aria-label="Estado"
        >
          {ESTADOS.map((e) => (
            <ToggleGroupItem key={e.valor} value={e.valor}>
              {e.texto}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {estantes.length > 0 && (
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={filtro.estanteId == null ? "" : String(filtro.estanteId)}
            onValueChange={(v) => onCambio({ ...filtro, estanteId: v ? Number(v) : null })}
            aria-label="Estante"
            className="flex-wrap"
          >
            {estantes.map((e) => (
              <ToggleGroupItem key={e.id} value={String(e.id)}>
                {e.nombre}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
    </section>
  );
}
