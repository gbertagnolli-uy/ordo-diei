"use client";

// Propio de Ordo: «Hoy aprendo», la vista del niño (la grilla de TarjetaHoy reemplaza al ModuleGrid de Roost).
// El saludo, el avatar y la racha son de solo lectura.

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Brain, Camera, ChevronDown, Compass, Flame, GraduationCap, Mic, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { decidirVista } from "@/lib/homeschooling/neuro";
import { avanceDelDia, duracion, mensajeDelDia } from "@/lib/homeschooling/saludo";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { HistoriaVista, Preferencia } from "@/lib/homeschooling/servidor/neuro";
import { toast } from "@/lib/toast";
import HistoriaCard from "@/components/homeschooling/neuro/HistoriaCard";
import PrimeroDespues from "@/components/homeschooling/neuro/PrimeroDespues";
import VisorHistoria from "@/components/homeschooling/neuro/VisorHistoria";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { DiaHoy } from "@/lib/homeschooling/servidor/hoy";
import type { MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import MaterialSuelto from "@/components/homeschooling/material/MaterialSuelto";
import EnviarEvidencia from "@/components/homeschooling/evidencia/EnviarEvidencia";
import RepasoDeHoy from "./RepasoDeHoy";
import BotonHoja from "./BotonHoja";
import TarjetaHoy from "./TarjetaHoy";
import VisorLeccion from "./VisorLeccion";

export default function HoyAprendo({
  nombre,
  fotoUrl,
  racha,
  dias,
  preferencia,
  historias,
  sueltos = [],
  saludo = "Hola",
  memoriaHoy = 0,
  lectura = null,
}: {
  nombre: string;
  fotoUrl: string | null;
  racha: number;
  dias: DiaHoy[];
  preferencia: Preferencia;
  historias: HistoriaVista[];
  /** Material que el padre dejó para hoy sin curso (lane 166) */
  sueltos?: MaterialVista[];
  /** «Buenos días» según la hora de la casa (lane 181) */
  saludo?: string;
  /** Cuántas oraciones le toca recitar hoy */
  memoriaHoy?: number;
  /** El libro que está leyendo */
  lectura?: { titulo: string; porcentaje: number | null } | null;
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

  const hechos = dias.filter((d) => d.estado === "hecha").length;
  const estadoDia = { total: dias.length + sueltos.length, hechos: hechos + sueltos.filter((m) => m.hecho).length };
  const pendientes = dias.filter((d) => d.estado !== "hecha");
  const siguiente = pendientes.find((d) => !(d.lecciones[0]?.bloqueada === true && d.lecciones.some((l) => l.bloqueada && !l.completada))) ?? null;
  const despues = pendientes.filter((d) => d !== siguiente);
  const hechosHoy = dias.filter((d) => d.estado === "hecha");
  const BASE = "/dashboard/homeschooling";

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <Avatar size="lg">
          {fotoUrl && <AvatarImage src={fotoUrl} alt="" />}
          <AvatarFallback>{nombre.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-foreground">
            {saludo}, {nombre}
          </h1>
          <p className="text-sm text-muted-foreground">{mensajeDelDia(estadoDia)}</p>
        </div>
        {racha > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-sm font-semibold text-warning" title="Racha">
            <Flame className="size-4" /> {racha}
          </span>
        )}
      </header>

      {estadoDia.total > 0 && (
        <div className="space-y-1.5" aria-label="Avance de hoy">
          <Progress value={avanceDelDia(estadoDia)} aria-label="Avance de hoy" />
          <p className="text-xs text-muted-foreground tabular-nums">
            {estadoDia.hechos} de {estadoDia.total} listo{estadoDia.hechos === 1 ? "" : "s"} hoy
          </p>
        </div>
      )}

      {historias.map((h) => (
        <HistoriaCard key={h.id} historia={h} onClick={setHistoria} />
      ))}

      <RepasoDeHoy />

      {vistaElegida.layout === "primero-despues" && dias.length > 0 ? (
        <PrimeroDespues dias={dias} recompensa={preferencia.recompensaDespues} onAbrir={(d) => setAbierto(d.diaId)} onFoto={setFotoDia} />
      ) : dias.length === 0 && sueltos.length === 0 ? (
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
        <>
          {siguiente && (
            <section aria-label="Lo que sigue" className="space-y-3 rounded-3xl border-2 border-primary bg-primary/5 p-5">
              <p className="text-xs font-bold tracking-widest text-primary">LO QUE SIGUE</p>
              <div>
                <p className="text-2xl leading-tight font-bold text-foreground">{siguiente.recurso.titulo}</p>
                <p className="mt-1 text-base text-muted-foreground">
                  {siguiente.materia.nombre} · {siguiente.rango} · unos {duracion(siguiente.minutosEstimados)}
                </p>
              </div>
              <Button size="lg" className="h-14 w-full text-lg" onClick={() => setAbierto(siguiente.diaId)}>
                <Play /> Empezar
              </Button>
              <div className="flex gap-2">
                <BotonHoja diaId={siguiente.diaId} restantes={siguiente.hojaRestantes} className="h-11 flex-1" />
                <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setFotoDia(siguiente)}>
                  <Camera /> Foto de mi trabajo
                </Button>
              </div>
            </section>
          )}

          {despues.length > 0 && (
            <section aria-label="Después" className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">{siguiente ? "Después" : "Para hoy"}</h2>
              {despues.map((d) => (
                <TarjetaHoy key={d.diaId} dia={d} onClick={(x) => setAbierto(x.diaId)} onFoto={setFotoDia} />
              ))}
            </section>
          )}

          {hechosHoy.length > 0 && (
            <details className="group rounded-2xl border bg-card" open={pendientes.length === 0}>
              <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold text-foreground">
                Hecho hoy ({hechosHoy.length})
                <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 p-3 pt-0">
                {hechosHoy.map((d) => (
                  <TarjetaHoy key={d.diaId} dia={d} onClick={(x) => setAbierto(x.diaId)} onFoto={setFotoDia} />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      <MaterialSuelto materiales={sueltos} />

      <nav aria-label="Más cosas" className="grid grid-cols-2 gap-3">
        <Link href={`${BASE}/lectura`} className="flex flex-col gap-1 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50">
          <BookOpen className="size-6 text-primary" />
          <span className="font-semibold text-foreground">Mi lectura</span>
          <span className="truncate text-xs text-muted-foreground">{lectura ? `${lectura.titulo}${lectura.porcentaje !== null ? ` · ${lectura.porcentaje}%` : ""}` : "Agregá un libro"}</span>
        </Link>
        <Link href={`${BASE}/memoria`} className="flex flex-col gap-1 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50">
          {memoriaHoy > 0 ? <Mic className="size-6 text-warning" /> : <Brain className="size-6 text-primary" />}
          <span className="font-semibold text-foreground">Mi memoria</span>
          <span className="truncate text-xs text-muted-foreground">{memoriaHoy > 0 ? `Hoy toca recitar ${memoriaHoy} con mamá o papá` : "Oraciones y listas"}</span>
        </Link>
        <Link href={`${BASE}/horas`} className="flex flex-col gap-1 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50">
          <Compass className="size-6 text-primary" />
          <span className="font-semibold text-foreground">Mis actividades</span>
          <span className="truncate text-xs text-muted-foreground">Fuera de la pantalla</span>
        </Link>
        <Link href={`${BASE}/portafolio`} className="flex flex-col gap-1 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50">
          <Camera className="size-6 text-primary" />
          <span className="font-semibold text-foreground">Mi portafolio</span>
          <span className="truncate text-xs text-muted-foreground">Mis trabajos</span>
        </Link>
      </nav>

      <label className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
        <span className="font-medium text-foreground">Modo calmo</span>
        <Switch checked={preferencia.modoRelajado} onCheckedChange={cambiarCalma} aria-label="Modo calmo" />
      </label>

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
