"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, ScrollText } from "lucide-react";
import { CabeceraLiturgica } from "./CabeceraLiturgica";
import { LiturgiaTexto } from "./LiturgiaTexto";
import { useLectura, rutaLiturgia } from "./useLectura";
import { useParametrosLiturgia } from "./useParametrosLiturgia";
import type { DocumentoResuelto } from "@/lib/liturgia/tipos";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OrdinariumVistaProps {
  className?: string;
}

/**
 * Pantalla Ordinarium — Ordinario (SPEC liturgia §10.6).
 * Pestañas: Ordo Missæ (con marcadores al propio hacia Missale) y Preces (oraciones comunes del Salterio).
 */
export function OrdinariumVista({ className }: OrdinariumVistaProps) {
  const { version, setVersion } = useParametrosLiturgia("ordinarium");
  const [tabActiva, setTabActiva] = useState<"ordo" | "preces">("ordo");

  // Lectura del Ordo Missae (Missa/Ordo/Ordo)
  const ordoLectura = useLectura<DocumentoResuelto>(
    tabActiva === "ordo" ? rutaLiturgia("libro", { tipo: "ordinarium", clave: "Missa/Ordo/Ordo", version }) : null,
  );

  // Lectura de Preces (Psalterium/Common/Prayers)
  const precesLectura = useLectura<DocumentoResuelto>(
    tabActiva === "preces" ? rutaLiturgia("libro", { tipo: "ordinarium", clave: "Psalterium/Common/Prayers", version }) : null,
  );

  return (
    <div className={cn("space-y-6 pb-12", className)}>
      {/* 1. Cabecera común sin selector de fecha */}
      <CabeceraLiturgica
        titulo="Ordinarium"
        subtitulo="Ordinario · Partes comunes del Santo Sacrificio y del Oficio Divino"
        version={version}
        onVersion={setVersion}
      />

      {/* 2. Pestañas: Ordo Missae y Preces */}
      <Tabs value={tabActiva} onValueChange={(v) => setTabActiva(v as "ordo" | "preces")} className="space-y-4">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="ordo" className="text-xs font-semibold">
            Ordo Missæ
          </TabsTrigger>
          <TabsTrigger value="preces" className="text-xs font-semibold">
            Preces comunes
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Ordo Missae */}
        <TabsContent value="ordo" className="space-y-4">
          {/* Banner explicativo con acceso al Missale */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-foreground">Partes fijas e invariables de la Misa</span>
              <p className="text-muted-foreground">
                Las lecturas, oraciones y cantos propios del día (Introito, Colecta, Epístola, Gradual, Evangelio, etc.) se rezan con el formulario del día.
              </p>
            </div>
            <Button asChild size="sm" variant="default" className="text-xs gap-1.5 shrink-0">
              <Link href="/dashboard/liturgia/missale">
                <span>Ir al Missale del día</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>

          {ordoLectura.estado === "cargando" ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : ordoLectura.estado === "ok" ? (
            <LiturgiaTexto documento={ordoLectura.datos} />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
              <ScrollText className="size-8 mx-auto text-muted-foreground/60" />
              <h3 className="font-heading text-base font-semibold">Ordo Missæ no generado</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                El texto del Ordinario de la Misa para la versión {version} todavía no fue generado en la base.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Preces */}
        <TabsContent value="preces" className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card p-4 text-xs text-muted-foreground">
            Oraciones comunes del Oficio Divino: Pater noster, Ave Maria, Credo, Confiteor, Gloria Patri y preces penitenciales.
          </div>

          {precesLectura.estado === "cargando" ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : precesLectura.estado === "ok" ? (
            <LiturgiaTexto documento={precesLectura.datos} />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
              <BookOpen className="size-8 mx-auto text-muted-foreground/60" />
              <h3 className="font-heading text-base font-semibold">Preces no generadas</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Las oraciones comunes del Salterio todavía no fueron cargadas en la base para esta versión.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
