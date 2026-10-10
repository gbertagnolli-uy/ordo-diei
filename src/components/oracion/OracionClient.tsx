"use client";

import { HeartHandshake, Sprout } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { HABITOS, type HabitoId } from "@/lib/oracion/catalogo";
import type { EstadoOracion } from "@/lib/oracion/server";
import { HabitoBloqueadoCard, HabitoCard } from "./HabitoCard";
import { EscaleraRosario } from "./EscaleraRosario";
import { CalendarioOracion } from "./CalendarioOracion";
import { Trayectoria } from "./Trayectoria";
import { useRegistrarOracion } from "./useRegistrarOracion";

// Orden del día: mañana, Rosario, noche
const ORDEN: HabitoId[] = ["matutinum", "rosario", "completorium"];

export function OracionClient({ inicial }: { inicial: EstadoOracion }) {
  const { estado, pendiente, registrar, comenzar } = useRegistrarOracion(inicial);
  const plan = estado.plan;

  if (!plan) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><Sprout /></EmptyMedia>
          <EmptyTitle className="font-heading text-2xl">Camino de oración</EmptyTitle>
          <EmptyDescription>
            Empezamos con poco: las oraciones de la noche y <strong>3 avemarías</strong> al día. Cuando las sostengas,
            el camino sube solo, a tu ritmo, hasta el Rosario completo y las oraciones de la mañana.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="lg" onClick={comenzar} disabled={pendiente === "plan"}>
            {pendiente === "plan" && <Spinner />} Comenzar hoy
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const habitos = [...plan.habitos].sort((a, b) => ORDEN.indexOf(a.habito) - ORDEN.indexOf(b.habito));
  const retomando = habitos.filter((h) => h.etapa === "retomando");
  const rosario = habitos.find((h) => h.habito === "rosario");

  return (
    <div className="space-y-6">
      {retomando.map((h) => (
        <Alert key={h.habito}>
          <HeartHandshake />
          <AlertTitle>{HABITOS[h.habito].nombre}: retomamos con calma</AlertTitle>
          <AlertDescription>
            Hubo varios días sin rezar y está bien: le pasa a todos. Ajustamos el paso a <strong>{h.pasoActual.titulo}</strong> para
            volver con firmeza. Cada día que reces cuenta como un regreso.
          </AlertDescription>
        </Alert>
      ))}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plan.matutinumBloqueado && <HabitoBloqueadoCard {...plan.matutinumBloqueado} />}
        {habitos.map((h) => (
          <HabitoCard key={h.habito} h={h} misterios={plan.misterios.misterios} ocupado={pendiente === h.habito} onRegistrar={registrar} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {rosario && <EscaleraRosario h={rosario} misterios={plan.misterios.misterios} />}
        <CalendarioOracion habitos={habitos} hoy={plan.hoy} />
      </div>

      <Trayectoria habitos={habitos} />
    </div>
  );
}
