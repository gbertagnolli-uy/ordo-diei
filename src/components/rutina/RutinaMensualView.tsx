"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Plus, Award, CalendarDays, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MetaMensual } from "@/lib/rutina/tipos";

interface RutinaMensualViewProps {
  metas: MetaMensual[];
  onToggleMeta: (id: string) => void;
  onAgregarMeta?: (titulo: string, virtud: string, descripcion: string) => void;
  esPadre?: boolean;
}

export function RutinaMensualView({
  metas,
  onToggleMeta,
  onAgregarMeta,
  esPadre = false,
}: RutinaMensualViewProps) {
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaVirtud, setNuevaVirtud] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !onAgregarMeta) return;
    onAgregarMeta(nuevoTitulo.trim(), nuevaVirtud.trim(), "");
    setNuevoTitulo("");
    setNuevaVirtud("");
    setMostrarFormulario(false);
  };

  const mesActualNombre = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
    new Date()
  );

  return (
    <div className="space-y-6">
      {/* Cabecera del Mes */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border bg-gradient-to-r from-primary/10 via-card to-card">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Ritmo Familiar Mensual
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground capitalize mt-0.5">
            {mesActualNombre}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Metas y virtudes que cultivamos juntos como familia este mes.
          </p>
        </div>

        {esPadre && onAgregarMeta && (
          <Button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            variant="default"
            size="sm"
            className="rounded-xl gap-1.5"
          >
            <Plus className="size-4" />
            <span>Nueva Meta Mensual</span>
          </Button>
        )}
      </div>

      {/* Formulario rápido para agregar meta (padres) */}
      {mostrarFormulario && (
        <form onSubmit={handleCrear} className="p-4 rounded-xl border bg-card/90 space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Agregar meta del mes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Título de la meta (ej. Rezar novena en familia)..."
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
              required
            />
            <Input
              placeholder="Virtud asociada (ej. Paciencia, Diligencia)..."
              value={nuevaVirtud}
              onChange={(e) => setNuevaVirtud(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setMostrarFormulario(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Guardar Meta
            </Button>
          </div>
        </form>
      )}

      {/* Listado de Metas del Mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metas.map((meta) => (
          <Card
            key={meta.id}
            className={`transition-all ${
              meta.completada
                ? "border-emerald-500/40 bg-emerald-500/5 opacity-80"
                : "border-border hover:border-primary/40"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleMeta(meta.id)}
                    className="mt-0.5 text-muted-foreground hover:text-emerald-500 transition-colors"
                  >
                    {meta.completada ? (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    ) : (
                      <Circle className="size-5" />
                    )}
                  </button>
                  <div>
                    <CardTitle
                      className={`text-sm font-semibold leading-snug ${
                        meta.completada ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {meta.titulo}
                    </CardTitle>
                    {meta.virtudDelMes && (
                      <Badge variant="outline" className="mt-1 text-[10px] font-medium border-primary/30 text-primary">
                        Virtud: {meta.virtudDelMes}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            {meta.descripcion && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {meta.descripcion}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
