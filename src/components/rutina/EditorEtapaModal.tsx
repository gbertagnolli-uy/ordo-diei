"use client";

import { AyudaIcono } from "@/components/AyudaIcono";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  EtapaRutina,
  CategoriaRutina,
  CATEGORIAS_INFO,
  DiasAplicables,
} from "@/lib/rutina/tipos";
import { duracionEtapaSegundos } from "@/lib/rutina/calculadorHorarios";
import { IconoRutina } from "./IconoRutina";
import { Bell, Trash2 } from "lucide-react";

interface EditorEtapaModalProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  etapaParaEditar: EtapaRutina | null;
  onGuardar: (etapa: EtapaRutina) => void;
  onEliminar?: (id: string) => void;
}

const ICONOS_DISPONIBLES = [
  "Sun",
  "BedDouble",
  "Church",
  "Utensils",
  "BookOpen",
  "Coffee",
  "Smile",
  "Sparkles",
  "GraduationCap",
  "Bell",
  "Activity",
  "Palette",
  "BookMarked",
  "Home",
  "Bath",
  "Moon",
  "Heart",
  "Trees",
  "Music",
];

export function EditorEtapaModal({
  abierto,
  onOpenChange,
  etapaParaEditar,
  onGuardar,
  onEliminar,
}: EditorEtapaModalProps) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("08:15");
  const [categoria, setCategoria] = useState<CategoriaRutina>("estudio");
  const [icono, setIcono] = useState("BookOpen");
  const [alarmaSonora, setAlarmaSonora] = useState(true);
  const [diasSemana, setDiasSemana] = useState<DiasAplicables>("todos");
  const [bloqueMacro, setBloqueMacro] = useState<EtapaRutina["bloqueMacro"]>("manana");

  useEffect(() => {
    if (etapaParaEditar) {
      setTitulo(etapaParaEditar.titulo);
      setDescripcion(etapaParaEditar.descripcion || "");
      setHoraInicio(etapaParaEditar.horaInicio);
      setHoraFin(etapaParaEditar.horaFin);
      setCategoria(etapaParaEditar.categoria);
      setIcono(etapaParaEditar.icono || "BookOpen");
      setAlarmaSonora(etapaParaEditar.alarmaSonora);
      setDiasSemana(etapaParaEditar.diasSemana);
      setBloqueMacro(etapaParaEditar.bloqueMacro || "manana");
    } else {
      setTitulo("");
      setDescripcion("");
      setHoraInicio("08:00");
      setHoraFin("08:30");
      setCategoria("estudio");
      setIcono("BookOpen");
      setAlarmaSonora(true);
      setDiasSemana("todos");
      setBloqueMacro("manana");
    }
  }, [etapaParaEditar, abierto]);

  // Duración estimada en minutos
  const duracionMin = Math.round(duracionEtapaSegundos(horaInicio, horaFin) / 60);
  const horariosInvalidos = !horaInicio || !horaFin || horaInicio === horaFin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || horariosInvalidos) return;

    const nuevaEtapa: EtapaRutina = {
      id: etapaParaEditar ? etapaParaEditar.id : `etapa-${Date.now()}`,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      horaInicio,
      horaFin,
      duracionMin: Math.max(1, duracionMin),
      categoria,
      icono,
      alarmaSonora,
      diasSemana,
      bloqueMacro,
    };

    onGuardar(nuevaEtapa);
    onOpenChange(false);
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-lg font-bold">
            {etapaParaEditar ? "Editar Etapa de Rutina" : "Nueva Etapa de Rutina"}
            <AyudaIcono titulo="Etapa de la rutina"><p>Una etapa es un bloque del día familiar (despertar, estudio, cena…) con su horario. Aparece en la línea de tiempo diaria y avisa cuando empieza.</p></AyudaIcono>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo" className="text-xs font-semibold">
              Título o Actividad <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Ángelus - Preparar almuerzo"
              required
              className="rounded-xl"
            />
          </div>

          {/* Horario Inicio y Fin */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="horaInicio" className="text-xs font-semibold">
                Hora de Inicio
              </Label>
              <Input
                id="horaInicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
                className="font-mono rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horaFin" className="text-xs font-semibold">
                Hora de Fin
              </Label>
              <Input
                id="horaFin"
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                required
                className="font-mono rounded-xl"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            Duración calculada: <strong>{duracionMin} minutos</strong>
          </p>
          {horariosInvalidos && (
            <p className="text-[11px] text-rose-600">
              La hora de inicio y la de fin no pueden ser iguales.
            </p>
          )}

          {/* Categoría */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Categoría</Label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaRutina)}
              className="w-full h-10 px-3 rounded-xl border bg-background text-sm font-medium"
            >
              {(Object.keys(CATEGORIAS_INFO) as CategoriaRutina[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORIAS_INFO[cat].label}
                </option>
              ))}
            </select>
          </div>

          {/* Días aplicables */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Días que aplica</Label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: "todos", label: "Todos los días" },
                { id: "laborables", label: "Lun a Vie" },
                { id: "finDeSemana", label: "Fines de sem." },
              ].map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  variant={diasSemana === opt.id ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs rounded-xl"
                  onClick={() => setDiasSemana(opt.id as DiasAplicables)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Selector de Icono */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Icono visual</Label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border bg-muted/30 max-h-28 overflow-y-auto">
              {ICONOS_DISPONIBLES.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcono(ic)}
                  className={`size-8 rounded-lg flex items-center justify-center transition-all ${
                    icono === ic
                      ? "bg-primary text-primary-foreground shadow-xs scale-105"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  title={ic}
                >
                  <IconoRutina nombre={ic} className="size-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Alarma sonora */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-amber-500" />
              <div>
                <span className="text-xs font-semibold block">Alarma sonora</span>
                <span className="text-[10px] text-muted-foreground">
                  Hacer sonar campana al inicio de esta etapa
                </span>
              </div>
            </div>
            <Switch checked={alarmaSonora} onCheckedChange={setAlarmaSonora} />
          </div>

          {/* Descripción opcional */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs font-semibold">
              Descripción o Instrucciones (opcional)
            </Label>
            <Textarea
              id="desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Instrucciones breves para los niños o recordatorios para los padres..."
              rows={2}
              className="rounded-xl text-xs"
            />
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-3">
            {etapaParaEditar && onEliminar ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-1.5 rounded-xl text-xs"
                onClick={() => {
                  if (confirm("¿Seguro de que deseas eliminar esta etapa?")) {
                    onEliminar(etapaParaEditar.id);
                    onOpenChange(false);
                  }
                }}
              >
                <Trash2 className="size-3.5" />
                Eliminar
              </Button>
            ) : <div />}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="rounded-xl" disabled={horariosInvalidos || !titulo.trim()}>
                Guardar Etapa
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
