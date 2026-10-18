// Compañero «héroe» en el inicio (lane 220): te recibe con la pose del momento, muestra tu nivel y lleva a su pantalla.
// Componente de servidor; elegir, nombrar y festejar son acciones de cliente.
import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ElegirCompanero, FestejarNivel } from "@/components/engagement/CompaneroAcciones";
import { EscenaCompanero } from "@/components/engagement/EscenaCompanero";
import { PERSONAJES_ELEGIBLES } from "@/lib/engagement/companero";
import type { CompaneroVista } from "@/lib/engagement/companeroServidor";

export function CompaneroCard({ datos }: { datos: CompaneroVista }) {
  const { quien, personaje, nombre, nivel, nivelNuevo, pose, frase, regreso, racha, equipados, marco } = datos;

  // Todavía no eligió: es lo primero que se le ofrece
  if (!personaje) {
    return (
      <Card aria-label="Tu compañero" className="gap-3 py-4">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Elegí quién te acompaña</CardTitle>
          <CardDescription>
            Un compañero te recibe cada día, celebra tus logros y crece con tu nivel: {PERSONAJES_ELEGIBLES.slice(0, 8).map((p) => p.emoji).join(" ")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ElegirCompanero actual={null} etiqueta="Elegir mi compañero" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card aria-label="Tu compañero" className="gap-3 py-4">
      <CardContent className="flex items-center gap-4">
        <EscenaCompanero key={`${pose}-${equipados.fondo}`} personaje={personaje} pose={pose} equipados={equipados} marco={marco} quien={quien} className="w-24 shrink-0 sm:w-28" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2 font-heading text-lg">
              {nombre} <Badge variant="secondary">Nivel {nivel.numero}</Badge>
              {racha >= 1 && (
                <Badge>
                  <Flame className="size-3" /> {racha} {racha === 1 ? "día" : "días"} en la app
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{nivelNuevo ? `¡Subiste al nivel ${nivel.numero}, ${nivel.titulo}!` : (regreso ?? frase)}</CardDescription>
          </div>
          <div className="space-y-1">
            <Progress value={nivel.avance} aria-label={`Avance hacia el nivel ${nivel.numero + 1}`} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {nivel.titulo} · a {nivel.faltan} XP del nivel {nivel.numero + 1}
            </p>
          </div>
          {nivelNuevo ? (
            <FestejarNivel />
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/companero">
                Ver mi compañero <ChevronRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
