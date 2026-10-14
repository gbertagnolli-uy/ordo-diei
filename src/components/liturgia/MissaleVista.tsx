"use client";

import React, { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { CabeceraLiturgica } from "./CabeceraLiturgica";
import { LiturgiaTexto } from "./LiturgiaTexto";
import { useLectura, rutaLiturgia } from "./useLectura";
import { useParametrosLiturgia } from "./useParametrosLiturgia";
import { filtrarSeccionesMisa, type ModoMisa } from "@/lib/liturgia/missa";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilaDia } from "@/lib/liturgia/repositorio";
import type { DocumentoResuelto } from "@/lib/liturgia/tipos";
import { cn } from "@/lib/utils";

interface MissaleVistaProps {
  className?: string;
}

/**
 * Pantalla Missale — Santo Sacrificio de la Misa (SPEC liturgia §10.3).
 * Incluye CabeceraLiturgica con nota D53 (1910 para 1888/1906), ToggleGroup «Solo el propio» / «Misa completa»
 * y lector bilingüe LiturgiaTexto.
 */
export function MissaleVista({ className }: MissaleVistaProps) {
  const { version, setVersion, fecha, setFecha } = useParametrosLiturgia("missale");
  const [modoMisa, setModoMisa] = useState<ModoMisa>("completa");

  // Lectura del día y del documento de la Misa
  const diaLectura = useLectura<FilaDia>(rutaLiturgia("dia", { fecha, version }));
  const docLectura = useLectura<DocumentoResuelto>(rutaLiturgia("missa", { fecha, version }));

  // Filtrado reactivo de secciones según modo (propio vs completa)
  const docFiltrado = useMemo(() => {
    if (docLectura.estado !== "ok" || !docLectura.datos) return null;
    return {
      ...docLectura.datos,
      secciones: filtrarSeccionesMisa(docLectura.datos.secciones, modoMisa),
    };
  }, [docLectura, modoMisa]);

  return (
    <div className={cn("space-y-6 pb-12", className)}>
      {/* 1. Cabecera común con nota D53 (Misal de 1910) */}
      <CabeceraLiturgica
        titulo="Missale"
        subtitulo="Sancta Missa · Santo Sacrificio"
        version={version}
        onVersion={setVersion}
        notaMisal={true}
        fecha={fecha}
        onFecha={setFecha}
        dia={diaLectura}
      />

      {/* 2. Barra de control: Selección de partes (Solo el propio vs Misa completa) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/50 py-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-medium text-muted-foreground">Partes de la Misa:</span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={modoMisa}
            onValueChange={(v) => v && setModoMisa(v as ModoMisa)}
            aria-label="Selección de partes de la Misa"
          >
            <ToggleGroupItem value="propio" aria-label="Solo el propio del día" className="text-xs">
              Solo el propio
            </ToggleGroupItem>
            <ToggleGroupItem value="completa" aria-label="Misa completa con Ordinario intercalado" className="text-xs">
              Misa completa
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {docFiltrado ? (
          <span className="text-xs text-muted-foreground font-sans">
            {docFiltrado.secciones.length} {docFiltrado.secciones.length === 1 ? "sección" : "secciones"}{" "}
            {modoMisa === "propio" ? "del propio" : "totales"}
          </span>
        ) : null}
      </div>

      {/* 3. Lector de la Misa o estados */}
      {docLectura.estado === "cargando" ? (
        <div className="space-y-4 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : docLectura.estado === "ok" && docFiltrado ? (
        docFiltrado.secciones.length > 0 ? (
          <LiturgiaTexto documento={docFiltrado} />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
            <BookOpen className="size-8 mx-auto text-muted-foreground/60" />
            <h3 className="font-heading text-base font-semibold">
              Sin secciones del propio
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Esta celebración no contiene secciones marcadas como propias independientes del Ordinario.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
          <BookOpen className="size-8 mx-auto text-muted-foreground/60" />
          <h3 className="font-heading text-base font-semibold">
            Misa no generada
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            El texto de la Santa Misa todavía no fue generado en la base para esta fecha y versión.
          </p>
        </div>
      )}
    </div>
  );
}
