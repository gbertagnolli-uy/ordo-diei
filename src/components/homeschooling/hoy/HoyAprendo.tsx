"use client";

// Propio de Ordo: «Hoy aprendo», la vista del niño (la grilla de TarjetaHoy reemplaza al ModuleGrid de Roost).
// El saludo, el avatar y la racha son de solo lectura.

import { useState } from "react";
import Link from "next/link";
import { Camera, Compass, Flame, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { decidirVista } from "@/lib/homeschooling/neuro";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { HistoriaVista, Preferencia } from "@/lib/homeschooling/servidor/neuro";
import { toast } from "@/lib/toast";
import HistoriaCard from "@/components/homeschooling/neuro/HistoriaCard";
import PrimeroDespues from "@/components/homeschooling/neuro/PrimeroDespues";
import VisorHistoria from "@/components/homeschooling/neuro/VisorHistoria";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { DiaHoy } from "@/lib/homeschooling/servidor/hoy";
import EnviarEvidencia from "@/components/homeschooling/evidencia/EnviarEvidencia";
import RepasoDeHoy from "./RepasoDeHoy";
import TarjetaHoy from "./TarjetaHoy";
import VisorLeccion from "./VisorLeccion";

export default function HoyAprendo({
  nombre,
  fotoUrl,
  racha,
  dias,
  preferencia,
  historias,
}: {
  nombre: string;
  fotoUrl: string | null;
  racha: number;
  dias: DiaHoy[];
  preferencia: Preferencia;
  historias: HistoriaVista[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState<number | null>(null);
  const [historia, setHistoria] = useState<HistoriaVista | null>(null);
  const [fotoDia, setFotoDia] = useState<DiaHoy | null>(null);
  const vistaElegida = decidirVista(preferencia);

  // El alumno puede apagar o prender su modo calmo; el atributo se aplica enseguida y se guarda en segundo plano
  const cambiarCalma = async (activo: boolean) => {
    if (activo) document.documentElement.dataset.relajado = "1";
    else delete document.documentElement.dataset.relajado;
    try {
      await api("/api/homeschooling/preferencias", { method: "PUT", body: { modoRelajado: activo } });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };
  const dia = dias.find((d) => d.diaId === abierto) ?? null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6 p-4 sm:p-6">
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

      <Button asChild variant="outline" className="w-full">
        <Link href="/dashboard/homeschooling/horas">
          <Compass /> Mis actividades
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href="/dashboard/homeschooling/portafolio">
          <Camera /> Mi portafolio
        </Link>
      </Button>

      <label className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
        <span className="font-medium text-foreground">Modo calmo</span>
        <Switch checked={preferencia.modoRelajado} onCheckedChange={cambiarCalma} aria-label="Modo calmo" />
      </label>

      {historias.map((h) => (
        <HistoriaCard key={h.id} historia={h} onClick={setHistoria} />
      ))}

      <RepasoDeHoy />

      {vistaElegida.layout === "primero-despues" && dias.length > 0 ? (
        <PrimeroDespues dias={dias} recompensa={preferencia.recompensaDespues} onAbrir={(d) => setAbierto(d.diaId)} onFoto={setFotoDia} />
      ) : dias.length === 0 ? (
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
            <TarjetaHoy key={d.diaId} dia={d} onClick={(x) => setAbierto(x.diaId)} onFoto={setFotoDia} />
          ))}
        </div>
      )}

      <VisorLeccion dia={dia} onClose={() => setAbierto(null)} />
      <EnviarEvidencia
        open={!!fotoDia}
        onClose={() => setFotoDia(null)}
        diaLectivoId={fotoDia?.diaId ?? null}
        titulo={fotoDia ? `${fotoDia.recurso.titulo}: ${fotoDia.rango}` : undefined}
        onEnviada={() => router.refresh()}
      />
      <VisorHistoria key={historia?.id ?? 0} historia={historia} onClose={() => setHistoria(null)} />
    </div>
  );
}
