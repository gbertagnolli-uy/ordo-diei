"use client";

// Premio grupal (lane 274): el % de tareas del grupo en un vaso y el premio que se gana al llegar a la meta.
import SloshGauge from "@/components/SloshGauge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { PremioGrupalVista as Vista } from "@/lib/engagement/premioGrupalServidor";

const TEXTO_ESTADO: Record<Vista["estado"], string> = {
  proximo: "Empieza pronto",
  "en-curso": "En curso",
  "por-evaluar": "Terminó: contando…",
  logrado: "¡Lo lograron! Cada uno tiene su vale en Mis premios",
  "no-logrado": "Esta vez no se llegó. ¡La próxima!",
};

const fecha = (clave: string) =>
  new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${clave}T00:00:00Z`));

export function PremioGrupalVista({ premio }: { premio: Vista | null }) {
  if (!premio) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No hay un premio grupal en curso</EmptyTitle>
          <EmptyDescription>Cuando tus padres armen uno, lo vas a ver acá.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <Card className="mx-auto w-full max-w-md text-center">
      <CardHeader>
        <CardDescription>Premio grupal · del {fecha(premio.desde)} al {fecha(premio.hasta)}</CardDescription>
        <CardTitle className="font-heading text-2xl">Vale por {premio.titulo}</CardTitle>
        {premio.descripcion && <p className="text-sm text-muted-foreground">{premio.descripcion}</p>}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <SloshGauge value={premio.porcentaje} showValue liquidColor="var(--primary)" glassColor="var(--muted)" />
        <p className="text-sm">
          Meta: <span className="font-semibold">{premio.porcentajeMeta} %</span> de las tareas · van {premio.hechas} de {premio.total}
        </p>
        <p className="font-medium">{TEXTO_ESTADO[premio.estado]}</p>
      </CardContent>
    </Card>
  );
}
