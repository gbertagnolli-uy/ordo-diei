"use client";

// Propio de Ordo (lane 185, D10): «Esta semana» en el panel de los padres — por hijo, lo que hizo de lunes a hoy. Un vistazo para
// saber cómo va cada uno sin abrir reportes; los números son los mismos que usan el boletín y la libreta.
import Link from "next/link";
import { BookOpen, Camera, Clock, Mic, NotebookPen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { horasTexto } from "@/lib/homeschooling/boletin";
import { letraDe } from "@/lib/homeschooling/calificaciones";
import type { ResumenSemanal as Datos } from "@/lib/homeschooling/servidor/resumenSemana";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
const f = (c: string) => FECHA.format(new Date(`${c}T00:00:00Z`));

export default function ResumenSemanal({ semana }: { semana: Datos }) {
  if (semana.hijos.length === 0) return null;
  return (
    <section aria-label="Esta semana" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Esta semana</h2>
        <p className="text-xs text-muted-foreground">
          {f(semana.desde)} al {f(semana.hasta)}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {semana.hijos.map((h) => {
          const avance = h.dias.planeados > 0 ? Math.round((h.dias.hechos / h.dias.planeados) * 100) : 0;
          return (
            <div key={h.id} className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  {h.fotoUrl && <AvatarImage src={h.fotoUrl} alt="" />}
                  <AvatarFallback>{h.nombre.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{h.nombre}</p>
                  <p className="text-xs text-muted-foreground">{h.dias.planeados === 0 ? "Sin clases esta semana" : `${h.dias.hechos} de ${h.dias.planeados} clases hechas`}</p>
                </div>
              </div>
              {h.dias.planeados > 0 && <Progress value={avance} aria-label={`${avance}% de las clases de la semana`} />}
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Clock className="size-4 shrink-0" /> {horasTexto(h.minutos)} de estudio
                </li>
                <li className="flex items-center gap-1.5">
                  <NotebookPen className="size-4 shrink-0" /> {h.notas.cantidad === 0 ? "Sin notas nuevas" : `${h.notas.cantidad} ${h.notas.cantidad === 1 ? "nota" : "notas"} · prom. ${h.notas.promedio?.toLocaleString("es")} (${letraDe(h.notas.promedio ?? 0)})`}
                </li>
                <li className="flex items-center gap-1.5">
                  <BookOpen className="size-4 shrink-0" /> {h.paginas} págs.{h.librosTerminados > 0 ? ` · ${h.librosTerminados} libro${h.librosTerminados === 1 ? "" : "s"} terminado${h.librosTerminados === 1 ? "" : "s"}` : ""}
                </li>
                <li className="flex items-center gap-1.5">
                  <Mic className="size-4 shrink-0" /> {h.recitados} {h.recitados === 1 ? "recitado" : "recitados"}
                </li>
                <li className="flex items-center gap-1.5">
                  <Camera className="size-4 shrink-0" /> {h.trabajos} {h.trabajos === 1 ? "trabajo enviado" : "trabajos enviados"}
                </li>
              </ul>
              <div className="flex gap-3 text-xs">
                <Link href={`/dashboard/homeschooling/semana?alumno=${h.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                  Ver la semana
                </Link>
                <Link href={`/dashboard/homeschooling/libreta?alumno=${h.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                  Libreta
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
