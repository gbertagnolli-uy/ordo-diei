"use client";

// Panel «Conducta» del perfil: promedio del mes, tira de los últimos 14 días y las notas recientes.
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { etiquetaConducta } from "@/lib/conducta/niveles";
import type { ResumenConducta } from "@/lib/conducta/server";
import { TiraConducta } from "./TiraConducta";

export function ConductaPerfil({ resumen, hoy, nombre, esPropio }: { resumen: ResumenConducta; hoy: string; nombre: string; esPropio: boolean }) {
  const notas = resumen.registros.filter((r) => r.nota).slice(-3).reverse();
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="font-heading text-lg">Conducta</CardTitle>
          <CardDescription>Cómo {esPropio ? "te venís portando" : `se viene portando ${nombre}`} en los últimos {resumen.dias} días.</CardDescription>
        </div>
        {resumen.promedio !== null && (
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {resumen.promedio.toLocaleString("es", { minimumFractionDigits: 1 })} · {etiquetaConducta(resumen.promedio)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {resumen.registrados === 0 ? (
          <Empty className="rounded-lg border py-8">
            <EmptyMedia variant="icon"><HeartHandshake className="size-4" /></EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Sin registros todavía</EmptyTitle>
              <EmptyDescription>Cuando papá o mamá marquen cómo te portaste cada día, lo vas a ver acá.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <TiraConducta registros={resumen.registros} hasta={hoy} />
            {notas.length > 0 && (
              <ul className="space-y-2 text-sm">
                {notas.map((n) => (
                  <li key={n.fecha} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{format(parseISO(n.fecha), "EEEE d 'de' MMMM", { locale: es })} · {etiquetaConducta(n.nivel)}</p>
                    <p>{n.nota}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
