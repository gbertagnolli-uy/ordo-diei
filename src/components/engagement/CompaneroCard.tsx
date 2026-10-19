// Invitación a elegir compañero en el inicio (lane 220, reducida en la lane 247): una vez elegido, el compañero
// ya no ocupa un bloque de la pantalla sino que flota en toda la app (ver CompaneroFlotante).
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ElegirCompanero } from "@/components/engagement/CompaneroAcciones";
import { PERSONAJES_ELEGIBLES } from "@/lib/engagement/companero";

export function ElegirCompaneroCard() {
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
