"use client";

// Portado de vendor/roost/src/components/groups/learn/ModuleCard.tsx (msrbuilds/roost@492af47).
// Cambios: variante grande para el niño (≥ 96 px de alto, objetivo táctil ≥ 44 px) con ícono y color de la materia,
// rango del día, Progress de ui/ y botón «Empezar»; bloqueada: gris + candado + motivo; tokens de Ordo.

import { CheckCircle2, Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { colorCss } from "@/components/homeschooling/cursos/iconos";
import IconoMateria from "@/components/homeschooling/cursos/IconoMateria";
import type { DiaHoy } from "@/lib/homeschooling/servidor/hoy";

export default function TarjetaHoy({ dia, onClick }: { dia: DiaHoy; onClick: (dia: DiaHoy) => void }) {
  const hecho = dia.estado === "hecha";
  const bloqueo = dia.lecciones.find((l) => l.bloqueada && !l.completada)?.motivo ?? null;
  const bloqueada = !hecho && !!bloqueo && dia.lecciones[0]?.bloqueada === true;

  return (
    <button
      type="button"
      disabled={bloqueada}
      onClick={() => onClick(dia)}
      className={`flex min-h-24 w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-colors ${
        bloqueada ? "cursor-not-allowed opacity-60" : "hover:border-primary/50"
      }`}
    >
      <span
        className={`flex size-14 shrink-0 items-center justify-center rounded-xl text-primary-foreground ${bloqueada ? "bg-muted text-muted-foreground" : ""}`}
        style={bloqueada ? undefined : { backgroundColor: colorCss(dia.materia.color) }}
      >
        {bloqueada ? <Lock className="size-7" /> : <IconoMateria nombre={dia.materia.icono} className="size-7" />}
      </span>

      <span className="min-w-0 flex-1 space-y-1">
        <span className="block text-xs font-medium text-muted-foreground">
          {dia.materia.nombre}
          {dia.adelantable && " · Para adelantar"}
        </span>
        <span className="block truncate text-lg font-semibold text-foreground">{dia.recurso.titulo}</span>
        <span className="block text-sm text-muted-foreground">{bloqueada ? bloqueo : dia.rango}</span>
        <Progress value={dia.progreso} />
      </span>

      {hecho ? (
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-success">
          <CheckCircle2 className="size-5" /> {dia.tareaEstado === "Aprobada" ? "Aprobado" : "En revisión"}
        </span>
      ) : (
        !bloqueada && (
          <Button asChild size="lg" className="pointer-events-none shrink-0">
            <span>
              <Play /> Empezar
            </span>
          </Button>
        )
      )}
    </button>
  );
}
