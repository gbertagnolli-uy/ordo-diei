"use client";

// Propio de Ordo: «Hoy aprendo», la vista del niño (la grilla de TarjetaHoy reemplaza al ModuleGrid de Roost).
// El saludo, el avatar y la racha son de solo lectura.

import { useState } from "react";
import { Flame, GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { DiaHoy } from "@/lib/homeschooling/servidor/hoy";
import TarjetaHoy from "./TarjetaHoy";
import VisorLeccion from "./VisorLeccion";

export default function HoyAprendo({ nombre, fotoUrl, racha, dias }: { nombre: string; fotoUrl: string | null; racha: number; dias: DiaHoy[] }) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const dia = dias.find((d) => d.diaId === abierto) ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <Avatar size="lg">
          {fotoUrl && <AvatarImage src={fotoUrl} alt="" />}
          <AvatarFallback>{nombre.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-foreground">¡Hola, {nombre}!</h1>
          <p className="text-sm text-muted-foreground">Esto es lo que toca aprender hoy</p>
        </div>
        {racha > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-sm font-semibold text-warning" title="Racha">
            <Flame className="size-4" /> {racha}
          </span>
        )}
      </header>

      {dias.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GraduationCap />
            </EmptyMedia>
            <EmptyTitle>Hoy no hay nada para estudiar</EmptyTitle>
            <EmptyDescription>Disfrutá el día. Cuando haya clase, va a aparecer acá.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {dias.map((d) => (
            <TarjetaHoy key={d.diaId} dia={d} onClick={(x) => setAbierto(x.diaId)} />
          ))}
        </div>
      )}

      <VisorLeccion dia={dia} onClose={() => setAbierto(null)} />
    </div>
  );
}
