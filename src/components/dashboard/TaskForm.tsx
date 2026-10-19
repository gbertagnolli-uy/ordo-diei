"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, Trophy, Gift, RefreshCw, Globe, Users, ListChecks, Plus, Trash2, ArrowUp, ArrowDown, Repeat } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SelectorNivel } from "@/components/SelectorNivel";
import Stepper, { Step } from "@/components/Stepper";
import { DIFICULTADES, DIFICULTAD_DEFAULT, DIFICULTAD_INFO, puntosBase, type Dificultad } from "@/lib/recompensaTarea";
import {
  DIAS_SEMANA_ORDEN,
  ETIQUETA_DIA_CORTO,
  normalizarRotacionConfig,
  type ModoRotacion,
  type RotacionConfig,
  type UnidadFrecuenciaRotacion,
} from "@/lib/rotacionTarea";
import { toast } from "@/lib/toast";

// Rampa verde → ámbar → rojo, derivada de los tokens success/warning/destructive de cada tema.
const COLORES_DIFICULTAD = {
  claro: ["#2D6A2E", "#557224", "#7C7A1A", "#A48210", "#B27809", "#A55C06", "#984103", "#8B2500"],
  oscuro: ["#6AAF6A", "#85AD61", "#A0AB59", "#BBA950", "#CB9E4A", "#CE8947", "#D17543", "#D46040"],
};
const NIVELES_DIFICULTAD = DIFICULTADES.map((d) => ({ valor: d, etiqueta: DIFICULTAD_INFO[d].etiqueta }));

// El Stepper toma los tokens de la app (cambian solos con la clase .dark), no sus temas propios.
const tinta = (pct: number) => `color-mix(in srgb, var(--foreground) ${pct}%, transparent)`;
const STEPPER_VARS = {
  "--stepper-ink": "var(--foreground)",
  "--stepper-muted": tinta(60),
  "--stepper-faint": tinta(25),
  "--stepper-ring": tinta(30),
  "--stepper-well": "var(--muted)",
  "--stepper-track": tinta(12),
  "--stepper-tile": "var(--card)",
  "--stepper-tile-edge": "var(--border)",
  "--stepper-tile-highlight": "transparent",
  "--stepper-tile-shadow": `0 1px 3px ${tinta(22)}`,
  "--stepper-solid": "var(--primary)",
  "--stepper-solid-ink": "var(--primary-foreground)",
  "--stepper-hover": "brightness(0.95)",
  "--stepper-hover-fill": tinta(5),
  "--stepper-solid-hover": "brightness(0.9)",
  "--stepper-press": "brightness(0.85)",
} as React.CSSProperties;

interface TaskFormProps {
  users: { id: number; nombre: string; rolFamiliar: string; fotoUrl?: string | null }[];
  task?: any; // If provided → edit mode
  onSuccess?: () => void; // Callback after successful save (e.g., close modal)
  isModal?: boolean; // If true, don't navigate away on success
}

export default function TaskForm({ users, task, onSuccess, isModal = false }: TaskFormProps) {
  const router = useRouter();
  const isEdit = !!task;
  const rotacionInicial = isEdit ? normalizarRotacionConfig(task.rotacionConfig) : null;

  const [loading, setLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(
    isEdit
      ? rotacionInicial
        ? rotacionInicial.responsablesIds
        : (task.asignadoIds ?? [task.asignadoId])
      : []
  );
  const [isGlobal, setIsGlobal] = useState(false);
  const [esRotativa, setEsRotativa] = useState<boolean>(Boolean(rotacionInicial));
  const [modoRotacion, setModoRotacion] = useState<ModoRotacion>(rotacionInicial?.modo ?? "frecuencia");
  const [rotacionCada, setRotacionCada] = useState<string>(
    String(rotacionInicial?.modo === "frecuencia" ? (rotacionInicial.cada ?? 1) : 1)
  );
  const [rotacionUnidad, setRotacionUnidad] = useState<UnidadFrecuenciaRotacion>(
    rotacionInicial?.modo === "frecuencia" ? (rotacionInicial.unidad ?? "dias") : "dias"
  );
  const [diasPorUsuario, setDiasPorUsuario] = useState<Record<string, number[]>>(
    rotacionInicial?.modo === "dias_semana" ? (rotacionInicial.diasPorUsuario ?? {}) : {}
  );

  const [intervalo, setIntervalo] = useState<string>(String(isEdit ? (task.intervalo ?? 1) : 1));
  const [anclajeCompletado, setAnclajeCompletado] = useState<boolean>(isEdit ? Boolean(task.anclaCompletado) : false);
  const [tipoRecurrencia, setTipoRecurrencia] = useState(
    isEdit ? (task.tipoRecurrencia || "Unica") : "Unica"
  );
  const [isChecklist, setIsChecklist] = useState(isEdit ? (task.isChecklist || false) : false);
  const [checklistItems, setChecklistItems] = useState<string[]>(
    isEdit && task.checklistItems ? task.checklistItems.map((ci: any) => ci.texto) : []
  );
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [dificultad, setDificultad] = useState<Dificultad>(isEdit ? (task.dificultad || DIFICULTAD_DEFAULT) : DIFICULTAD_DEFAULT);
  const [minutos, setMinutos] = useState<string>(isEdit ? String(Math.floor(task.tiempoEjecucionEstimadoSeg / 60)) : "");

  const [titulo, setTitulo] = useState<string>(isEdit ? task.titulo : "");
  const [descripcion, setDescripcion] = useState<string>(isEdit ? (task.descripcion || "") : "");
  const [fecha, setFecha] = useState<string>(isEdit && task.fechaVencimiento ? new Date(task.fechaVencimiento).toISOString().split("T")[0] : "");
  const [hora, setHora] = useState<string>(() => {
    if (!isEdit || !task.horaEjecucion) return "";
    const d = new Date(task.horaEjecucion);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [diaSemana, setDiaSemana] = useState<string>(String(isEdit ? (task.diaDeLaSemana ?? 1) : 1));
  const [diaMes, setDiaMes] = useState<string>(String(isEdit ? (task.diaDelMes ?? 1) : 1));
  const [ordinal, setOrdinal] = useState<string>(String(isEdit ? (task.ordinalSemana ?? 1) : 1));
  const [sorpresa, setSorpresa] = useState<boolean>(isEdit ? Boolean(task.isSurpriseEligible) : false);
  const [paso, setPaso] = useState(1);

  const effectiveUserIds = isGlobal ? users.map((u) => u.id) : selectedUserIds;

  const toggleUser = (id: number) => {
    setSelectedUserIds((prev) => {
      const next = prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id];
      if (next.length < 2) setEsRotativa(false);
      return next;
    });
  };

  const moverResponsable = (idx: number, dir: -1 | 1) => {
    const base = isGlobal ? users.map((u) => u.id) : [...selectedUserIds];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= base.length) return;
    const temp = base[idx];
    base[idx] = base[targetIdx];
    base[targetIdx] = temp;
    if (isGlobal) setIsGlobal(false);
    setSelectedUserIds(base);
  };

  const toggleDiaParaUsuario = (userId: number, dia: number) => {
    setDiasPorUsuario((prev) => {
      const actuales = prev[String(userId)] ?? [];
      const nuevos = actuales.includes(dia)
        ? actuales.filter((d) => d !== dia)
        : [...actuales, dia].sort((a, b) => a - b);
      return {
        ...prev,
        [String(userId)]: nuevos,
      };
    });
  };

  const construirRotacionPayload = (): RotacionConfig | null => {
    if (!esRotativa || effectiveUserIds.length < 2) return null;
    const fechaAncla = (fecha ? new Date(`${fecha}T00:00:00.000Z`) : new Date()).toISOString().slice(0, 10);
    if (modoRotacion === "frecuencia") {
      return {
        modo: "frecuencia",
        responsablesIds: effectiveUserIds,
        cada: Math.max(1, Math.floor(Number(rotacionCada) || 1)),
        unidad: rotacionUnidad,
        fechaAncla,
      };
    }
    const mapaLimpio: Record<string, number[]> = {};
    for (const uid of effectiveUserIds) {
      mapaLimpio[String(uid)] = (diasPorUsuario[String(uid)] ?? []).slice().sort((a, b) => a - b);
    }
    return {
      modo: "dias_semana",
      responsablesIds: effectiveUserIds,
      diasPorUsuario: mapaLimpio,
      fechaAncla,
    };
  };

  /** Devuelve el mensaje de error del paso, o null si está completo. */
  const validar = (n: number): string | null => {
    if (n === 1 && !titulo.trim()) return "Ponele un título a la tarea.";
    if (n === 2) {
      if (!isGlobal && selectedUserIds.length === 0) {
        return "Seleccioná al menos un usuario o activá la tarea global.";
      }
      if (esRotativa && effectiveUserIds.length < 2) {
        return "Para rotar responsables necesitás seleccionar al menos 2 personas.";
      }
      if (esRotativa && modoRotacion === "frecuencia" && !(Number(rotacionCada) >= 1)) {
        return "Indicá cada cuántos días, semanas o meses varía el responsable.";
      }
      if (esRotativa && modoRotacion === "dias_semana") {
        const totalDias = effectiveUserIds.reduce(
          (acc, uid) => acc + (diasPorUsuario[String(uid)]?.length ?? 0),
          0
        );
        if (totalDias === 0) {
          return "Seleccioná al menos un día de la semana para los responsables.";
        }
      }
    }
    if (n === 3) {
      if (!esRotativa && tipoRecurrencia === "Unica" && !fecha) return "Elegí la fecha límite.";
      if (!hora) return "Elegí la hora límite.";
    }
    if (n === 4 && !(Number(minutos) > 0)) return "Ingresá el tiempo estimado en minutos.";
    return null;
  };

  const enviar = async () => {
    setLoading(true);
    const rotacionConfig = construirRotacionPayload();
    const recurrenciaEfectiva = rotacionConfig && tipoRecurrencia === "Unica" ? "Diaria" : tipoRecurrencia;
    const comun = {
      titulo,
      descripcion,
      tiempoMinutos: minutos,
      fecha: recurrenciaEfectiva === "Unica" ? fecha : (fecha || null),
      hora,
      tipoRecurrencia: recurrenciaEfectiva,
      diaDelMes: recurrenciaEfectiva === "Mensual_Fecha" ? diaMes : null,
      ordinalSemana: recurrenciaEfectiva === "Mensual_Ordinal" ? ordinal : null,
      diaDeLaSemana: recurrenciaEfectiva === "Semanal" || recurrenciaEfectiva === "Mensual_Ordinal" ? diaSemana : null,
      intervalo,
      anclaCompletado: anclajeCompletado,
      generaRecompensa: true,
      dificultad,
      isSurpriseEligible: sorpresa,
      checklistItems: isChecklist ? checklistItems.filter(i => i.trim()) : [],
      rotacionConfig,
    };

    try {
      if (isEdit) {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...comun, asignadoIds: effectiveUserIds }),
        });
        if (res.ok) {
          if (onSuccess) onSuccess();
          else window.location.reload();
        } else {
          toast.error("Error al actualizar la tarea");
        }
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...comun, asignadoIds: isGlobal ? [] : selectedUserIds, esGlobal: isGlobal, isChecklist }),
        });
        if (res.ok) {
          if (onSuccess) onSuccess();
          else if (!isModal) router.push("/dashboard");
          else window.location.reload();
        } else {
          const error = await res.json();
          toast.error(error.error || "Error al crear la tarea");
        }
      }
    } catch {
      toast.error(isEdit ? "Error de conexión" : "Hubo un error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Edición: formulario de una sola página. Alta: pasos del Stepper.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    for (let n = 1; n <= 4; n++) {
      const error = validar(n);
      if (error) {
        toast.error(error);
        return;
      }
    }
    void enviar();
  };

  const fid = (name: string) => `task-${name}-${isEdit ? "edit" : "new"}`;

  const seccionQue = (
    <FieldGroup>
        <Field>
          <FieldLabel htmlFor={fid("titulo")}>Título de la Tarea *</FieldLabel>
          <Input id={fid("titulo")} required name="titulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Recoger los juguetes" />
        </Field>

        <Field>
          <FieldLabel htmlFor={fid("descripcion")}>Descripción (Opcional)</FieldLabel>
          <Textarea id={fid("descripcion")} name="descripcion" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Asegúrate de dejar la caja ordenada..." />
        </Field>

    </FieldGroup>
  );

  const seccionQuien = (
    <FieldGroup>
        {/* CREATE: Global toggle */}
        {!isEdit && (
          <Field orientation="horizontal" className="rounded-lg border bg-muted/40 p-4">
            <Globe className="mt-0.5 size-5 shrink-0 text-primary" />
            <FieldContent>
              <FieldLabel htmlFor={fid("global")}>Tarea Global</FieldLabel>
              <FieldDescription>Seleccionar automáticamente a todos los miembros de la familia.</FieldDescription>
            </FieldContent>
            <Switch
              id={fid("global")}
              checked={isGlobal}
              onCheckedChange={() => {
                const nextGlobal = !isGlobal;
                setIsGlobal(nextGlobal);
                if (nextGlobal) {
                  setSelectedUserIds(users.map((u) => u.id));
                } else {
                  setSelectedUserIds([]);
                  setEsRotativa(false);
                }
              }}
            />
          </Field>
        )}

        {/* Multi-select users (crear y editar) */}
        {!isGlobal && (
          <FieldSet>
            <FieldLegend variant="label" className="flex items-center gap-2">
              <Users className="size-4 text-primary" /> Responsables (seleccioná uno o más) *
            </FieldLegend>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={selectedUserIds.map(String)}
              className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {users.map(u => (
                <ToggleGroupItem
                  key={u.id}
                  value={String(u.id)}
                  onClick={() => toggleUser(u.id)}
                  className="h-auto justify-start gap-3 rounded-lg! border px-3 py-2.5 data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                >
                  <Avatar className="size-9">
                    <AvatarImage src={u.fotoUrl ?? undefined} alt={u.nombre} className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground">{u.nombre.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-sm font-medium">{u.nombre}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{u.rolFamiliar.replace("_", " ")}</span>
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FieldSet>
        )}

        {/* Configuración de rotación cuando hay 2 o más responsables */}
        {effectiveUserIds.length >= 2 && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <Field orientation="horizontal">
              <Repeat className="mt-0.5 size-5 shrink-0 text-primary" />
              <FieldContent>
                <FieldLabel htmlFor={fid("rotar-responsables")}>Rotar responsable por turnos</FieldLabel>
                <FieldDescription>
                  {esRotativa
                    ? "Tarea compartida rotativa: se asigna y muestra únicamente al responsable que le toca en el día correspondiente."
                    : "Modo simultáneo: se creará una copia independiente de la tarea para cada responsable seleccionado."}
                </FieldDescription>
              </FieldContent>
              <Switch
                id={fid("rotar-responsables")}
                checked={esRotativa}
                onCheckedChange={(checked) => {
                  setEsRotativa(checked);
                  if (checked && tipoRecurrencia === "Unica") {
                    setTipoRecurrencia("Diaria");
                  }
                }}
              />
            </Field>

            {esRotativa && (
              <div className="space-y-4 pt-2 border-t border-border/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={modoRotacion === "frecuencia" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setModoRotacion("frecuencia")}
                    className="justify-center"
                  >
                    Por frecuencia (días / semanas / meses)
                  </Button>
                  <Button
                    type="button"
                    variant={modoRotacion === "dias_semana" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setModoRotacion("dias_semana")}
                    className="justify-center"
                  >
                    Por días de la semana para cada uno
                  </Button>
                </div>

                {modoRotacion === "frecuencia" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor={fid("rotacion-cada")}>Variar responsable cada</FieldLabel>
                        <Input
                          id={fid("rotacion-cada")}
                          type="number"
                          min="1"
                          max="365"
                          value={rotacionCada}
                          onChange={(e) => setRotacionCada(e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={fid("rotacion-unidad")}>Unidad de rotación</FieldLabel>
                        <NativeSelect
                          id={fid("rotacion-unidad")}
                          value={rotacionUnidad}
                          onChange={(e) => setRotacionUnidad(e.target.value as UnidadFrecuenciaRotacion)}
                          className="w-full"
                        >
                          <NativeSelectOption value="dias">Días</NativeSelectOption>
                          <NativeSelectOption value="semanas">Semanas</NativeSelectOption>
                          <NativeSelectOption value="meses">Meses</NativeSelectOption>
                        </NativeSelect>
                      </Field>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Orden de rotación de responsables:
                      </span>
                      <div className="space-y-1.5">
                        {effectiveUserIds.map((uid, idx) => {
                          const u = users.find((usr) => usr.id === uid);
                          if (!u) return null;
                          return (
                            <div
                              key={uid}
                              className="flex items-center justify-between rounded-md border bg-card px-3 py-1.5 text-sm"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary tabular-nums">
                                  {idx + 1}
                                </span>
                                <span className="truncate font-medium">{u.nombre}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  disabled={idx === 0}
                                  onClick={() => moverResponsable(idx, -1)}
                                  aria-label={`Subir a ${u.nombre}`}
                                >
                                  <ArrowUp className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  disabled={idx === effectiveUserIds.length - 1}
                                  onClick={() => moverResponsable(idx, 1)}
                                  aria-label={`Bajar a ${u.nombre}`}
                                >
                                  <ArrowDown className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Seleccioná qué días de la semana le toca la tarea a cada responsable. Podés asignar <strong>más de un responsable el mismo día</strong> para crear tareas en grupo:
                    </p>
                    <div className="space-y-2.5">
                      {effectiveUserIds.map((uid) => {
                        const u = users.find((usr) => usr.id === uid);
                        if (!u) return null;
                        const diasUsuario = diasPorUsuario[String(uid)] ?? [];
                        return (
                          <div
                            key={uid}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border bg-card p-2.5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="size-7">
                                <AvatarImage src={u.fotoUrl ?? undefined} alt={u.nombre} className="object-cover" />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {u.nombre.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-sm font-medium">{u.nombre}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              {DIAS_SEMANA_ORDEN.map((dia) => {
                                const activo = diasUsuario.includes(dia);
                                return (
                                  <Button
                                    key={dia}
                                    type="button"
                                    size="xs"
                                    variant={activo ? "default" : "outline"}
                                    onClick={() => toggleDiaParaUsuario(uid, dia)}
                                    className="w-8 px-0 font-semibold"
                                    title={ETIQUETA_DIA_CORTO[dia]}
                                  >
                                    {ETIQUETA_DIA_CORTO[dia]}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

    </FieldGroup>
  );

  const seccionCuando = (
    <FieldGroup>
        {esRotativa && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground flex items-center gap-1.5">
              <Repeat className="size-3.5 text-primary" /> Rotación de responsables activa
            </p>
            <p className="mt-1">
              {modoRotacion === "dias_semana"
                ? "La tarea se asignará automáticamente en los días de la semana elegidos para cada responsable y solo le aparecerá a quien le toque ese día."
                : `El responsable irá rotando cada ${rotacionCada || 1} ${rotacionUnidad} según el orden definido en el paso anterior.`}
            </p>
          </div>
        )}

        {/* Recurrence */}
        {(!esRotativa || modoRotacion === "frecuencia") && (
          <Field className="rounded-lg border bg-muted/40 p-4">
            <FieldLabel htmlFor={fid("recurrencia")} className="flex items-center gap-2"><RefreshCw className="size-4 text-primary" /> Recurrencia (Auto-Regeneración)</FieldLabel>
            <NativeSelect
              id={fid("recurrencia")}
              name="tipoRecurrencia"
              value={esRotativa && tipoRecurrencia === "Unica" ? "Diaria" : tipoRecurrencia}
              onChange={(e) => setTipoRecurrencia(e.target.value)}
              className="w-full"
            >
              {!esRotativa && <NativeSelectOption value="Unica">Solo una vez (Sin Recreación)</NativeSelectOption>}
              <NativeSelectOption value="Diaria">Diaria (Se regenera cada día)</NativeSelectOption>
              <NativeSelectOption value="Semanal">Semanal (Día específico de la semana)</NativeSelectOption>
              <NativeSelectOption value="Mensual_Fecha">Mensual (Día exacto del mes)</NativeSelectOption>
              <NativeSelectOption value="Mensual_Ordinal">Mensual (Ej: Primer Viernes)</NativeSelectOption>
            </NativeSelect>

            {tipoRecurrencia === "Semanal" && (
              <Field className="mt-2">
                <FieldLabel htmlFor={fid("dia-semana")}>Día de la semana</FieldLabel>
                <NativeSelect id={fid("dia-semana")} name="diaDeLaSemana" value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} className="w-full">
                      <NativeSelectOption value="1">Lunes</NativeSelectOption>
                      <NativeSelectOption value="2">Martes</NativeSelectOption>
                      <NativeSelectOption value="3">Miércoles</NativeSelectOption>
                      <NativeSelectOption value="4">Jueves</NativeSelectOption>
                      <NativeSelectOption value="5">Viernes</NativeSelectOption>
                      <NativeSelectOption value="6">Sábado</NativeSelectOption>
                      <NativeSelectOption value="0">Domingo</NativeSelectOption>
                </NativeSelect>
              </Field>
            )}

            {tipoRecurrencia === "Mensual_Fecha" && (
              <Field className="mt-2">
                <FieldLabel htmlFor={fid("dia-mes")}>Día del mes (1-31)</FieldLabel>
                <Input id={fid("dia-mes")} name="diaDelMes" type="number" min="1" max="31" value={diaMes} onChange={(e) => setDiaMes(e.target.value)} />
              </Field>
            )}

            {tipoRecurrencia === "Mensual_Ordinal" && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor={fid("ordinal")}>Orden</FieldLabel>
                  <NativeSelect id={fid("ordinal")} name="ordinalSemana" value={ordinal} onChange={(e) => setOrdinal(e.target.value)} className="w-full">
                    <NativeSelectOption value="1">Primer</NativeSelectOption>
                    <NativeSelectOption value="2">Segundo</NativeSelectOption>
                    <NativeSelectOption value="3">Tercer</NativeSelectOption>
                    <NativeSelectOption value="4">Cuarto</NativeSelectOption>
                    <NativeSelectOption value="-1">Último</NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor={fid("ordinal-dia")}>Día</FieldLabel>
                  <NativeSelect id={fid("ordinal-dia")} name="diaDeLaSemana" value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} className="w-full">
                      <NativeSelectOption value="1">Lunes</NativeSelectOption>
                      <NativeSelectOption value="2">Martes</NativeSelectOption>
                      <NativeSelectOption value="3">Miércoles</NativeSelectOption>
                      <NativeSelectOption value="4">Jueves</NativeSelectOption>
                      <NativeSelectOption value="5">Viernes</NativeSelectOption>
                      <NativeSelectOption value="6">Sábado</NativeSelectOption>
                      <NativeSelectOption value="0">Domingo</NativeSelectOption>
                  </NativeSelect>
                </Field>
              </div>
            )}

            {tipoRecurrencia !== "Unica" && !esRotativa && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor={fid("intervalo")}>Repetir cada</FieldLabel>
                  <Input id={fid("intervalo")} type="number" min="1" max="365" value={intervalo} onChange={(e) => setIntervalo(e.target.value)} />
                  <FieldDescription>{tipoRecurrencia === "Diaria" ? "días" : tipoRecurrencia === "Semanal" ? "semanas" : "meses"}</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor={fid("ancla")}>Contar desde</FieldLabel>
                  <NativeSelect id={fid("ancla")} value={anclajeCompletado ? "completado" : "calendario"} onChange={(e) => setAnclajeCompletado(e.target.value === "completado")} className="w-full">
                    <NativeSelectOption value="calendario">El calendario</NativeSelectOption>
                    <NativeSelectOption value="completado">Cuando la completo</NativeSelectOption>
                  </NativeSelect>
                </Field>
              </div>
            )}
          </Field>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(tipoRecurrencia === "Unica" || esRotativa) && (
            <Field>
              <FieldLabel htmlFor={fid("fecha")} className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" /> {esRotativa ? "Fecha de inicio de rotación (opcional)" : "Fecha Límite"}
              </FieldLabel>
              <Input id={fid("fecha")} required={!esRotativa} name="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor={fid("hora")} className="flex items-center gap-2"><Clock className="size-4 text-primary" /> Hora Límite</FieldLabel>
            <Input id={fid("hora")} required name="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </Field>

        </div>

    </FieldGroup>
  );

  const seccionEsfuerzo = (
    <FieldGroup>
        <Field>
          <FieldLabel htmlFor={fid("tiempo")} className="flex items-center gap-2"><Clock className="size-4 text-primary" /> Tiempo Estimado (Minutos) *</FieldLabel>
          <Input id={fid("tiempo")} required name="tiempoMinutos" type="number" min="1" value={minutos} onChange={(e) => setMinutos(e.target.value)} placeholder="Ej: 15" />
        </Field>

        <Field>
          <FieldLabel htmlFor={fid("dificultad")} className="flex items-center gap-2"><Trophy className="size-4 text-primary" /> Dificultad</FieldLabel>
          <SelectorNivel
            id={fid("dificultad")}
            niveles={NIVELES_DIFICULTAD}
            valor={dificultad}
            onChange={setDificultad}
            colores={COLORES_DIFICULTAD}
            ariaLabel="Dificultad de la tarea"
          />
          <FieldDescription>
            {Number(minutos) > 0
              ? `Recompensa base: ${puntosBase(dificultad, Number(minutos) * 60)} pts (más bonos de racha, checklist y horario).`
              : "Ingresá el tiempo estimado para ver la recompensa base."}
          </FieldDescription>
        </Field>
    </FieldGroup>
  );

  const seccionExtras = (
    <FieldGroup>
        {/* Checklist */}
        <div className="rounded-lg border bg-muted/40 p-4">
          <Field orientation="horizontal">
            <ListChecks className="size-5 shrink-0 text-[var(--success)]" />
            <FieldLabel htmlFor={fid("checklist")} className="flex-1">¿Es checklist?</FieldLabel>
            <Switch
              id={fid("checklist")}
              checked={isChecklist}
              onCheckedChange={() => { setIsChecklist(!isChecklist); if (isChecklist) setChecklistItems([]); }}
              className="data-[state=checked]:bg-[var(--success)]"
            />
          </Field>
          {isChecklist && (
            <div className="mt-4 space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 text-right text-sm text-muted-foreground tabular-nums">{idx + 1}.</span>
                  <Input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...checklistItems];
                      updated[idx] = e.target.value;
                      setChecklistItems(updated);
                    }}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Quitar">
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newChecklistItem.trim()) {
                      e.preventDefault();
                      setChecklistItems([...checklistItems, newChecklistItem.trim()]);
                      setNewChecklistItem("");
                    }
                  }}
                  placeholder="Agregar sub-tarea..."
                  className="flex-1"
                />
                <Button type="button" size="icon" onClick={() => { if (newChecklistItem.trim()) { setChecklistItems([...checklistItems, newChecklistItem.trim()]); setNewChecklistItem(""); } }} aria-label="Agregar sub-tarea">
                  <Plus />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Surprise toggle */}
        <Field orientation="horizontal" className="rounded-lg border bg-muted/40 p-4">
          <Checkbox name="isSurpriseEligible" id={`recompensa_${isEdit ? 'edit' : 'new'}`} checked={sorpresa} onCheckedChange={(v) => setSorpresa(v === true)} />
          <FieldLabel htmlFor={`recompensa_${isEdit ? 'edit' : 'new'}`} className="flex items-center gap-2 text-secondary">
            <Gift className="size-4" /> ¿Genera recompensas sorpresa al completarse?
          </FieldLabel>
        </Field>

    </FieldGroup>
  );

  if (isEdit) {
    return (
      <form onSubmit={handleSubmit} className={isModal ? "max-h-[70vh] overflow-y-auto px-1" : ""}>
        <FieldGroup>
          {seccionQue}
          {seccionQuien}
          {seccionCuando}
          {seccionEsfuerzo}
          {seccionExtras}
          <Button disabled={loading} type="submit" size="lg" className="w-full">
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </FieldGroup>
      </form>
    );
  }

  const PASOS = 5;
  return (
    <Stepper
      step={paso}
      onStepChange={setPaso}
      linear
      frame={false}
      width="100%"
      style={STEPPER_VARS}
      backButtonText="Atrás"
      nextButtonText="Siguiente"
      completeButtonText={loading ? "Creando..." : "Registrar Tarea"}
      nextButtonProps={{
        disabled: loading,
        onClick: (e) => {
          const error = validar(paso);
          if (error) {
            e.preventDefault();
            toast.error(error);
          } else if (paso === PASOS) {
            e.preventDefault();
            void enviar();
          }
        },
      }}
    >
      <Step title="Qué">{seccionQue}</Step>
      <Step title="Quién">{seccionQuien}</Step>
      <Step title="Cuándo">{seccionCuando}</Step>
      <Step title="Esfuerzo">{seccionEsfuerzo}</Step>
      <Step title="Extras">{seccionExtras}</Step>
    </Stepper>
  );
}
