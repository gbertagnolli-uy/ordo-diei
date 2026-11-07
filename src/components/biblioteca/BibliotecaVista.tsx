"use client";
// Portado de vendor/homebranch-web/src/app/routes/dashboard/{library,currently-reading}.tsx (lane 270, fase 2):
// encabezado, fila «Seguir leyendo» (lo que este usuario está leyendo, lo último primero), filtros y grilla.
// Los datos los trae la página (servidor); acá solo se filtra con filtrarLibros.
import { useMemo, useState, type ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { filtrarLibros, type FiltroBiblioteca } from "@/lib/biblioteca/reglas";
import type { EstanteVista, LibroResumen } from "@/lib/biblioteca/servidor";
import { FiltrosBiblioteca } from "./FiltrosBiblioteca";
import { TarjetaLibro } from "./TarjetaLibro";

const GRILLA = "grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6";

export function BibliotecaVista({
  libros,
  estantes,
  acciones,
}: {
  libros: LibroResumen[];
  estantes: EstanteVista[];
  /** Botones del encabezado (p. ej. «Gestionar» para los padres). */
  acciones?: ReactNode;
}) {
  const [filtro, setFiltro] = useState<FiltroBiblioteca>({});
  const visibles = useMemo(() => filtrarLibros(libros, filtro), [libros, filtro]);
  const leyendo = useMemo(
    () =>
      libros
        .filter((l) => l.estado === "leyendo")
        .sort((a, b) => (b.actualizadoEn ?? "").localeCompare(a.actualizadoEn ?? "")),
    [libros],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca</h1>
          <p className="text-muted-foreground">Encontrá tu próxima lectura o volvé a un viejo favorito.</p>
        </div>
        {acciones}
      </header>

      {leyendo.length > 0 && (
        <section aria-labelledby="seguir-leyendo" className="flex flex-col gap-3">
          <h2 id="seguir-leyendo" className="text-lg font-semibold">
            Seguir leyendo
          </h2>
          <div className={GRILLA}>
            {leyendo.slice(0, 6).map((l) => (
              <TarjetaLibro key={l.id} libro={l} />
            ))}
          </div>
        </section>
      )}

      <FiltrosBiblioteca filtro={filtro} onCambio={setFiltro} estantes={estantes} />

      {libros.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>La biblioteca está lista para su primer libro</EmptyTitle>
            <EmptyDescription>Cuando papá o mamá suban libros, van a aparecer acá.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : visibles.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Ningún libro coincide con la búsqueda.</p>
      ) : (
        <section aria-label="Libros" className={GRILLA}>
          {visibles.map((l) => (
            <TarjetaLibro key={l.id} libro={l} />
          ))}
        </section>
      )}
    </div>
  );
}
