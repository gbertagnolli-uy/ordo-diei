"use client";

// Portado de vendor/roost/src/components/groups/learn/LessonPlayer.tsx (msrbuilds/roost@492af47).
// Cambios: visor a pantalla completa (Sheet); iframe con urlEmbed (youtube-nocookie); sin comentarios; un solo botón
// «Terminé» (se borra la rama de markLessonIncomplete, L43); en la última lección del día completa la Tarea con
// /api/tasks/[id]/complete y abre TASK_SUCCESS como useTaskActions.finishTask; libros/PDF muestran el rango y el enlace.
// H4: el video se reproduce con react-player (checkpoints que pausan con una pregunta) y, si la lección tiene quiz final,
// «Terminé» pasa por el quiz (la nota la calcula el servidor).

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Download, ExternalLink } from "lucide-react";
import { useMantenerActivo } from "@/hooks/useInactividad";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { esArchivoVideo, urlEmbed } from "@/lib/homeschooling/video";
import ComentariosEstudio from "@/components/homeschooling/comunidad/ComentariosEstudio";
import MarkdownTexto from "@/components/homeschooling/material/MarkdownTexto";
import MaterialesDelDia from "@/components/homeschooling/material/MaterialesDelDia";
import type { DiaHoy, LeccionHoy } from "@/lib/homeschooling/servidor/hoy";
import { useModalStore } from "@/store/modalStore";
import { toast } from "@/lib/toast";
import QuizFinal, { type ResultadoQuiz } from "./QuizFinal";
import ReproductorLeccion from "./ReproductorLeccion";
import EnviarEvidencia from "@/components/homeschooling/evidencia/EnviarEvidencia";
import LeccionesDelDia from "./LeccionesDelDia";

export default function VisorLeccion({ dia, onClose }: { dia: DiaHoy | null; onClose: () => void }) {
  useMantenerActivo("homeschooling-visor", !!dia); // un video largo o un quiz no cuentan como inactividad (N4)
  const router = useRouter();
  const openModal = useModalStore((s) => s.openModal);
  const [completadas, setCompletadas] = useState<Set<number>>(new Set());
  const [activaId, setActivaId] = useState<number | undefined>();
  const [cargando, setCargando] = useState(false);
  const [foto, setFoto] = useState(false);
  const [haciendoQuiz, setHaciendoQuiz] = useState(false);
  const inicio = useRef(Date.now());

  // Al abrir un día: arranca en la primera lección pendiente y empieza a contar el tiempo
  useEffect(() => {
    if (!dia) return;
    inicio.current = Date.now();
    setCompletadas(new Set());
    setHaciendoQuiz(false);
    setActivaId((dia.lecciones.find((l) => !l.completada && !l.bloqueada) ?? dia.lecciones[0])?.id);
  }, [dia]);

  const lecciones = useMemo(() => dia?.lecciones ?? [], [dia]);
  const actual = lecciones.find((l) => l.id === activaId);
  const indice = actual ? lecciones.indexOf(actual) : -1;
  const hechaActual = !!actual && (actual.completada || completadas.has(actual.id));
  // YouTube/Vimeo por su embed; un enlace a un archivo de video (.mp4, .webm…) lo reproduce el propio navegador
  const embed = actual?.videoPlataforma && actual.videoId ? urlEmbed(actual.videoPlataforma, actual.videoId) : esArchivoVideo(actual?.url) ? (actual?.url ?? null) : null;
  const hechoElDia = dia?.estado === "hecha";

  // Después de completar una lección (con o sin quiz): seguir con la próxima o, si era la última, completar la Tarea del día
  const cerrarLeccion = async (ultimaDelDia: boolean, tareaIdNueva: number | null) => {
    if (!dia) return;
    const tareaId = tareaIdNueva ?? dia.tareaId;
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
  };

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
      await cerrarLeccion(ultimaDelDia, tareaId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setCargando(false);
    }
  };

  const quizAprobado = async (r: ResultadoQuiz) => {
    if (!actual) return;
    setCargando(true);
    try {
      setCompletadas((c) => new Set(c).add(actual.id));
      setHaciendoQuiz(false);
      await cerrarLeccion(r.ultimaDelDia, r.tareaId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setCargando(false);
    }
  };

  const cambiar = (l: LeccionHoy) => {
    setHaciendoQuiz(false);
    setActivaId(l.id);
  };

  // ← / → pasan a la lección anterior / siguiente (la siguiente solo si esta ya está hecha o no tiene candado)
  useEffect(() => {
    if (!dia || haciendoQuiz) return;
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft" && indice > 0) cambiar(lecciones[indice - 1]);
      if (e.key === "ArrowRight" && indice >= 0 && indice < lecciones.length - 1 && (hechaActual || !lecciones[indice + 1].bloqueada)) cambiar(lecciones[indice + 1]);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [dia, haciendoQuiz, indice, hechaActual, lecciones]);

  return (
    <Sheet open={!!dia} onOpenChange={(o) => !o && !cargando && onClose()}>
      <SheetContent side="bottom" className="h-svh max-h-svh gap-0 overflow-y-auto rounded-none p-0 data-[side=bottom]:h-svh data-[side=bottom]:max-h-svh">
        {dia && (
          <>
            <SheetHeader className="border-b p-4 pr-14">
              <SheetTitle>{dia.recurso.titulo}</SheetTitle>
              <SheetDescription>
                {dia.materia.nombre} · {dia.rango}
                {lecciones.length > 1 && indice >= 0 ? ` · lección ${indice + 1} de ${lecciones.length}` : ""}
              </SheetDescription>
              {lecciones.length > 1 && (
                <div className="mt-2 flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={lecciones.length} aria-valuenow={lecciones.filter((l) => l.completada || completadas.has(l.id)).length} aria-label="Lecciones del día">
                  {lecciones.map((l) => (
                    <span key={l.id} className={`h-1.5 flex-1 rounded-full transition-colors ${l.completada || completadas.has(l.id) ? "bg-success" : l.id === activaId ? "bg-primary" : "bg-muted"}`} />
                  ))}
                </div>
              )}
            </SheetHeader>

            <div className="mx-auto w-full min-w-0 max-w-3xl space-y-5 p-4">
              {actual ? (
                haciendoQuiz ? (
                  // Con el quiz en marcha se muestra solo el quiz (en el teléfono quedaba debajo de todo lo demás)
                  <QuizFinal leccionId={actual.id} onAprobado={quizAprobado} onRepasar={() => setHaciendoQuiz(false)} />
                ) : (
                  <>
                    {embed ? (
                      <ReproductorLeccion key={actual.id} leccionId={actual.id} src={embed} titulo={actual.titulo} tieneCheckpoints={actual.checkpoints > 0} />
                    ) : (
                      actual.url && (
                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline" size="lg">
                            <a href={actual.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink /> Abrir el material
                            </a>
                          </Button>
                          {actual.url.startsWith("/api/archivos/") && (
                            <Button asChild size="lg">
                              <a href={`${actual.url}${actual.url.includes("?") ? "&" : "?"}descargar=1`} download>
                                <Download /> Descargar documento
                              </a>
                            </Button>
                          )}
                        </div>
                      )
                    )}
                    {actual.miniaturaUrl && !actual.miniaturaUrl.includes("ytimg.com") && (
                      <figure className="overflow-hidden rounded-xl border bg-muted/20 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={actual.miniaturaUrl} alt={actual.titulo} className="mx-auto max-h-96 w-auto rounded object-contain" />
                      </figure>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {actual.orden}. {actual.titulo}
                      </h2>
                      {actual.instrucciones && (
                        <div className="mt-2 rounded-lg bg-muted/30 p-3.5">
                          <MarkdownTexto texto={actual.instrucciones} markdown className="text-sm leading-6" />
                        </div>
                      )}
                    </div>
                    <MaterialesDelDia materiales={actual.materiales} titulo="Material de esta lección" />
                    <ComentariosEstudio key={actual.id} destino={{ leccionId: actual.id }} titulo="Preguntas y comentarios" placeholder="Escribile a mamá o a papá sobre esta lección…" />
                    {lecciones.length > 1 && <LeccionesDelDia lecciones={lecciones} completadas={completadas} activaId={activaId} onSelect={cambiar} />}
                  </>
                )
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

              <MaterialesDelDia materiales={dia.materiales} titulo="Material del día" />

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
                  <Button
                    size="lg"
                    onClick={actual?.quiz && !hechaActual ? () => setHaciendoQuiz(true) : terminar}
                    disabled={cargando || haciendoQuiz || (!!actual && actual.bloqueada && !hechaActual)}
                  >
                    {cargando ? <Spinner /> : <CheckCircle2 />} {actual?.quiz && !hechaActual ? "Hacer el quiz" : "Terminé"}
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
