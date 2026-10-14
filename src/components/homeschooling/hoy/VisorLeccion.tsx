"use client";

// Portado de vendor/roost/src/components/groups/learn/LessonPlayer.tsx (msrbuilds/roost@492af47).
// Cambios: visor a pantalla completa (Sheet); iframe con urlEmbed (youtube-nocookie); sin comentarios; un solo botón
// «Terminé» (se borra la rama de markLessonIncomplete, L43); en la última lección del día completa la Tarea con
// /api/tasks/[id]/complete y abre TASK_SUCCESS como useTaskActions.finishTask; libros/PDF muestran el rango y el enlace.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { urlEmbed } from "@/lib/homeschooling/video";
import type { DiaHoy, LeccionHoy } from "@/lib/homeschooling/servidor/hoy";
import { useModalStore } from "@/store/modalStore";
import { toast } from "@/lib/toast";
import EnviarEvidencia from "@/components/homeschooling/evidencia/EnviarEvidencia";
import LeccionesDelDia from "./LeccionesDelDia";

export default function VisorLeccion({ dia, onClose }: { dia: DiaHoy | null; onClose: () => void }) {
  const router = useRouter();
  const openModal = useModalStore((s) => s.openModal);
  const [completadas, setCompletadas] = useState<Set<number>>(new Set());
  const [activaId, setActivaId] = useState<number | undefined>();
  const [cargando, setCargando] = useState(false);
  const [foto, setFoto] = useState(false);
  const inicio = useRef(Date.now());

  // Al abrir un día: arranca en la primera lección pendiente y empieza a contar el tiempo
  useEffect(() => {
    if (!dia) return;
    inicio.current = Date.now();
    setCompletadas(new Set());
    setActivaId((dia.lecciones.find((l) => !l.completada && !l.bloqueada) ?? dia.lecciones[0])?.id);
  }, [dia]);

  const lecciones = useMemo(() => dia?.lecciones ?? [], [dia]);
  const actual = lecciones.find((l) => l.id === activaId);
  const indice = actual ? lecciones.indexOf(actual) : -1;
  const hechaActual = !!actual && (actual.completada || completadas.has(actual.id));
  const embed = actual?.videoPlataforma && actual.videoId ? urlEmbed(actual.videoPlataforma, actual.videoId) : null;
  const hechoElDia = dia?.estado === "hecha";

  const terminar = async () => {
    if (!dia) return;
    setCargando(true);
    try {
      let tareaId = dia.tareaId;
      let ultimaDelDia = true;
      if (actual) {
        const r = await api<{ ultimaDelDia: boolean; tareaId: number | null }>(`/api/homeschooling/lecciones/${actual.id}/completar`, { method: "POST" });
        setCompletadas((c) => new Set(c).add(actual.id));
        ultimaDelDia = r.ultimaDelDia;
        tareaId = r.tareaId ?? tareaId;
      } else if (!tareaId) {
        tareaId = (await api<{ tareaId: number | null }>(`/api/homeschooling/dias/${dia.diaId}/tarea`, { method: "POST" })).tareaId;
      }

      if (!ultimaDelDia) {
        const siguiente = lecciones[indice + 1];
        if (siguiente) setActivaId(siguiente.id);
        router.refresh();
        return;
      }
      if (!tareaId) throw new Error("No se pudo preparar la tarea de hoy");

      const res = await fetch(`/api/tasks/${tareaId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: Math.round((Date.now() - inicio.current) / 1000) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo completar la tarea");
      openModal("TASK_SUCCESS", {
        mensaje: data.mensaje,
        puntos: data.puntos,
        basePoints: data.basePoints,
        streakBonus: data.streakBonus,
        isNewStreak: data.isNewStreak,
        streakDays: data.streakDays,
        isHappyHour: data.isHappyHour,
      });
      toast.success("¡Listo!", "Tu mamá o tu papá lo va a revisar");
      onClose();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setCargando(false);
    }
  };

  const cambiar = (l: LeccionHoy) => setActivaId(l.id);

  return (
    <Sheet open={!!dia} onOpenChange={(o) => !o && !cargando && onClose()}>
      <SheetContent side="bottom" className="h-svh max-h-svh gap-0 overflow-y-auto rounded-none p-0">
        {dia && (
          <>
            <SheetHeader className="border-b p-4 pr-14">
              <SheetTitle>{dia.recurso.titulo}</SheetTitle>
              <SheetDescription>
                {dia.materia.nombre} · {dia.rango}
              </SheetDescription>
            </SheetHeader>

            <div className="mx-auto w-full max-w-3xl space-y-5 p-4">
              {actual ? (
                <>
                  {embed ? (
                    <div className="overflow-hidden rounded-xl bg-muted">
                      <div className="relative aspect-video">
                        <iframe
                          src={embed}
                          className="absolute inset-0 size-full"
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={actual.titulo}
                        />
                      </div>
                    </div>
                  ) : (
                    actual.url && (
                      <Button asChild variant="outline" size="lg">
                        <a href={actual.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink /> Abrir el material
                        </a>
                      </Button>
                    )
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {actual.orden}. {actual.titulo}
                    </h2>
                    {actual.instrucciones && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{actual.instrucciones}</p>}
                  </div>
                  {lecciones.length > 1 && <LeccionesDelDia lecciones={lecciones} completadas={completadas} activaId={activaId} onSelect={cambiar} />}
                </>
              ) : (
                <div className="space-y-3 rounded-xl border bg-card p-5">
                  <p className="text-lg font-semibold text-foreground">{dia.rango}</p>
                  {dia.recurso.url && (
                    <Button asChild variant="outline" size="lg">
                      <a href={dia.recurso.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink /> Abrir el material
                      </a>
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground">Cuando termines, tocá «Terminé».</p>
                </div>
              )}

              <Button variant="outline" size="lg" className="w-full" onClick={() => setFoto(true)}>
                <Camera /> Sacar una foto de mi trabajo
              </Button>

              <div className="flex items-center justify-between gap-2 border-t pt-4">
                <Button variant="outline" size="lg" disabled={indice <= 0} onClick={() => cambiar(lecciones[indice - 1])}>
                  <ArrowLeft /> Anterior
                </Button>
                {hechoElDia || (hechaActual && !actual?.bloqueada && indice < lecciones.length - 1) ? (
                  hechoElDia ? (
                    <span className="flex items-center gap-2 text-sm font-medium text-success">
                      <CheckCircle2 className="size-5" /> Hecho
                    </span>
                  ) : (
                    <Button size="lg" onClick={() => cambiar(lecciones[indice + 1])}>
                      Siguiente <ArrowRight />
                    </Button>
                  )
                ) : (
                  <Button size="lg" onClick={terminar} disabled={cargando || (!!actual && actual.bloqueada && !hechaActual)}>
                    {cargando ? <Spinner /> : <CheckCircle2 />} Terminé
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
      <EnviarEvidencia open={foto} onClose={() => setFoto(false)} diaLectivoId={dia?.diaId ?? null} titulo={dia ? `${dia.recurso.titulo}: ${dia.rango}` : undefined} />
    </Sheet>
  );
}
