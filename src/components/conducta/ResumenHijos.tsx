"use client";

// Panel de los padres: una pestaña por hijo con conducta, rendimiento, pendientes y tareas de un vistazo.
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CalendarClock, CheckCircle2, Flame, HeartHandshake, ListChecks, Sparkles, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DIFICULTAD_INFO, esDificultad } from "@/lib/recompensaTarea";
import { etiquetaConducta } from "@/lib/conducta/niveles";
import type { ResumenHijo } from "@/lib/conducta/resumenHijos";
import { TiraConducta } from "./TiraConducta";

function Dato({ icon: Icon, etiqueta, valor, alerta }: { icon: typeof Star; etiqueta: string; valor: string | number; alerta?: boolean }) {
  return (
    <div className={"flex items-center gap-3 rounded-lg border p-3 " + (alerta ? "border-destructive/40 bg-destructive/5" : "")}>
      <Icon className={"size-4 shrink-0 " + (alerta ? "text-destructive" : "text-primary")} />
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none tabular-nums">{valor}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{etiqueta}</p>
      </div>
    </div>
  );
}

function Hijo({ h, hoy }: { h: ResumenHijo; hoy: string }) {
  const c = h.conducta;
  const ultimaNota = [...c.registros].reverse().find((r) => r.nota);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading text-lg"><HeartHandshake className="size-4 text-primary" /> Conducta</CardTitle>
            <CardDescription>{c.registrados ? `${c.registrados} de los últimos ${c.dias} días registrados` : "Todavía sin registros"}</CardDescription>
          </div>
          {c.promedio !== null && <Badge variant="secondary" className="tabular-nums">{c.promedio.toLocaleString("es", { minimumFractionDigits: 1 })} · {etiquetaConducta(c.promedio)}</Badge>}
        </CardHeader>
        <CardContent className="space-y-3">
          <TiraConducta registros={c.registros} hasta={hoy} />
          {ultimaNota && (
            <p className="rounded-lg border p-3 text-sm">
              <span className="block text-xs text-muted-foreground">{format(parseISO(ultimaNota.fecha), "EEEE d 'de' MMMM", { locale: es })}</span>
              {ultimaNota.nota}
            </p>
          )}
          <Button variant="outline" size="sm" asChild><Link href="/dashboard/admin/conducta">Registrar conducta</Link></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-heading text-lg"><Sparkles className="size-4 text-primary" /> Rendimiento</CardTitle>
          <CardDescription>Esta semana y en total.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Dato icon={CheckCircle2} etiqueta="Hechas esta semana" valor={h.tareas.completadasSemana} />
            <Dato icon={Flame} etiqueta="Días de racha" valor={h.racha} />
            <Dato icon={Star} etiqueta="Puntos disponibles" valor={h.puntos} />
            <Dato icon={ListChecks} etiqueta="Tareas completadas" valor={h.tareasCompletadasTotal} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Cumplimiento</span><span className="tabular-nums">{h.cumplimiento}%</span></div>
            <Progress value={h.cumplimiento} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Constancia en hábitos ({h.habitos.activos})</span>
              <span className="tabular-nums">{h.habitos.constanciaPromedio === null ? "—" : `${h.habitos.constanciaPromedio}%`}</span>
            </div>
            <Progress value={h.habitos.constanciaPromedio ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-heading text-lg"><CalendarClock className="size-4 text-primary" /> Pendientes y tareas</CardTitle>
          <CardDescription>Lo que {h.nombre} tiene abierto, lo más urgente primero.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Dato icon={ListChecks} etiqueta="Abiertas" valor={h.tareas.abiertas} />
            <Dato icon={CalendarClock} etiqueta="Para hoy o antes" valor={h.tareas.paraHoy} />
            <Dato icon={AlertTriangle} etiqueta="Vencidas" valor={h.tareas.vencidas} alerta={h.tareas.vencidas > 0} />
            <Dato icon={CheckCircle2} etiqueta="Esperando aprobación" valor={h.tareas.esperandoAprobacion} />
          </div>
          {h.tareas.proximas.length === 0 ? (
            <Empty className="rounded-lg border py-8">
              <EmptyMedia variant="icon"><CheckCircle2 className="size-4" /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Sin tareas abiertas</EmptyTitle>
                <EmptyDescription>{h.nombre} está al día.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="divide-y rounded-lg border">
              {h.tareas.proximas.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{t.titulo}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {esDificultad(t.dificultad) && <Badge variant="outline" className="text-xs">{DIFICULTAD_INFO[t.dificultad].etiqueta}</Badge>}
                    {t.estado === "Vencida" && <Badge variant="destructive" className="text-xs">Vencida</Badge>}
                    <span className="text-xs text-muted-foreground">{t.fechaVencimiento ? format(parseISO(t.fechaVencimiento), "d MMM", { locale: es }) : "Sin fecha"}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><Link href="/dashboard/admin/agenda">Agenda master</Link></Button>
            <Button variant="outline" size="sm" asChild><Link href={`/dashboard/perfil?usuarioId=${h.id}`}>Ver perfil de {h.nombre}</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ResumenHijos({ hijos, hoy }: { hijos: ResumenHijo[]; hoy: string }) {
  if (hijos.length === 0) {
    return (
      <Empty className="rounded-lg border py-12">
        <EmptyHeader>
          <EmptyTitle>Todavía no hay hijos</EmptyTitle>
          <EmptyDescription>Cuando agregues a tus hijos a la familia, vas a ver acá su resumen.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <Tabs defaultValue={String(hijos[0].id)} className="gap-4">
      <TabsList className="h-auto flex-wrap justify-start">
        {hijos.map((h) => (
          <TabsTrigger key={h.id} value={String(h.id)} className="gap-2 px-3 py-1.5">
            <Avatar className="size-5">
              {h.fotoUrl && <AvatarImage src={h.fotoUrl} alt="" />}
              <AvatarFallback className="text-[10px]">{h.nombre.slice(0, 1)}</AvatarFallback>
            </Avatar>
            {h.nombre}
            {h.tareas.vencidas > 0 && <span className="size-2 rounded-full bg-destructive" aria-label={`${h.tareas.vencidas} tareas vencidas`} />}
          </TabsTrigger>
        ))}
      </TabsList>
      {hijos.map((h) => (
        <TabsContent key={h.id} value={String(h.id)}><Hijo h={h} hoy={hoy} /></TabsContent>
      ))}
    </Tabs>
  );
}
