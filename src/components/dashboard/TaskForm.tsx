"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, Trophy, Gift, RefreshCw, Globe, Users, ListChecks, Plus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import SloshGauge from "@/components/SloshGauge";
import { DIFICULTADES, DIFICULTAD_DEFAULT, DIFICULTAD_INFO, puntosBase, type Dificultad } from "@/lib/recompensaTarea";
import { toast } from "@/lib/toast";

const COLOR_DIFICULTAD: Record<Dificultad, string> = { Facil: "#4ade80", Media: "#facc15", Dificil: "#fb923c", Ardua: "#f87171" };

// El gauge es continuo (0–100): se arrastra libre y al soltar se acomoda en el centro del tramo.
const nivelDe = (d: Dificultad) => (DIFICULTADES.indexOf(d) + 1) * 25;
const dificultadDe = (v: number): Dificultad => DIFICULTADES[Math.min(3, Math.max(0, Math.ceil(v / 25) - 1))];

interface TaskFormProps {
  users: { id: number; nombre: string; rolFamiliar: string; fotoUrl?: string | null }[];
  task?: any; // If provided → edit mode
  onSuccess?: () => void; // Callback after successful save (e.g., close modal)
  isModal?: boolean; // If true, don't navigate away on success
}

export default function TaskForm({ users, task, onSuccess, isModal = false }: TaskFormProps) {
  const router = useRouter();
  const isEdit = !!task;
  const [loading, setLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(
    isEdit ? (task.asignadoIds ?? [task.asignadoId]) : []
  );
  const [isGlobal, setIsGlobal] = useState(false);
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
  const [nivel, setNivel] = useState(() => nivelDe(isEdit ? (task.dificultad || DIFICULTAD_DEFAULT) : DIFICULTAD_DEFAULT));
  const [minutos, setMinutos] = useState<string>(isEdit ? String(Math.floor(task.tiempoEjecucionEstimadoSeg / 60)) : "");

  const toggleUser = (id: number) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isGlobal && selectedUserIds.length === 0) {
      toast.error("Selecciona al menos un usuario o activa la tarea global.");
      return;
    }
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    if (isEdit) {
      // EDIT mode
      const body: any = {
        titulo: formData.get("titulo"),
        descripcion: formData.get("descripcion"),
        asignadoIds: selectedUserIds,
        tiempoMinutos: formData.get("tiempoMinutos"),
        fecha: formData.get("fecha"),
        hora: formData.get("hora"),
        tipoRecurrencia: tipoRecurrencia,
        diaDelMes: formData.get("diaDelMes"),
        ordinalSemana: formData.get("ordinalSemana"),
        diaDeLaSemana: formData.get("diaDeLaSemana"),
        intervalo,
        anclaCompletado: anclajeCompletado,
        generaRecompensa: true,
        dificultad,
        isSurpriseEligible: formData.get("isSurpriseEligible") === "on",
        checklistItems: isChecklist ? checklistItems.filter(i => i.trim()) : [],
      };

      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          if (onSuccess) onSuccess();
          else window.location.reload();
        } else {
          toast.error("Error al actualizar la tarea");
        }
      } catch {
        toast.error("Error de conexión");
      } finally {
        setLoading(false);
      }
    } else {
      // CREATE mode
      const body = {
        titulo: formData.get("titulo"),
        descripcion: formData.get("descripcion"),
        asignadoIds: isGlobal ? [] : selectedUserIds,
        tiempoMinutos: formData.get("tiempoMinutos"),
        fecha: formData.get("fecha"),
        hora: formData.get("hora"),
        tipoRecurrencia: tipoRecurrencia,
        diaDelMes: formData.get("diaDelMes"),
        ordinalSemana: formData.get("ordinalSemana"),
        diaDeLaSemana: formData.get("diaDeLaSemana"),
        intervalo,
        anclaCompletado: anclajeCompletado,
        generaRecompensa: true,
        dificultad,
        isSurpriseEligible: formData.get("isSurpriseEligible") === "on",
        esGlobal: isGlobal,
        isChecklist: isChecklist,
        checklistItems: isChecklist ? checklistItems.filter(i => i.trim()) : [],
      };

      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          if (onSuccess) onSuccess();
          else if (!isModal) router.push("/dashboard");
          else window.location.reload();
        } else {
          const error = await res.json();
          toast.error(error.error || "Error al crear la tarea");
        }
      } catch {
        toast.error("Hubo un error de conexión");
      } finally {
        setLoading(false);
      }
    }
  };

  const fid = (name: string) => `task-${name}-${isEdit ? "edit" : "new"}`;

  return (
    <form onSubmit={handleSubmit} className={isModal ? "max-h-[70vh] overflow-y-auto px-1" : ""}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={fid("titulo")}>Título de la Tarea *</FieldLabel>
          <Input id={fid("titulo")} required name="titulo" type="text" defaultValue={isEdit ? task.titulo : ""} placeholder="Ej: Recoger los juguetes" />
        </Field>

        <Field>
          <FieldLabel htmlFor={fid("descripcion")}>Descripción (Opcional)</FieldLabel>
          <Textarea id={fid("descripcion")} name="descripcion" rows={3} defaultValue={isEdit ? (task.descripcion || "") : ""} placeholder="Asegúrate de dejar la caja ordenada..." />
        </Field>

        {/* CREATE: Global toggle */}
        {!isEdit && (
          <Field orientation="horizontal" className="rounded-lg border bg-muted/40 p-4">
            <Globe className="mt-0.5 size-5 shrink-0 text-primary" />
            <FieldContent>
              <FieldLabel htmlFor={fid("global")}>Tarea Global</FieldLabel>
              <FieldDescription>Se asignará automáticamente a todos los miembros de la familia.</FieldDescription>
            </FieldContent>
            <Switch id={fid("global")} checked={isGlobal} onCheckedChange={() => { setIsGlobal(!isGlobal); if (!isGlobal) setSelectedUserIds([]); }} />
          </Field>
        )}

        {/* Multi-select users (crear y editar) */}
        {!isGlobal && (
          <FieldSet>
            <FieldLegend variant="label" className="flex items-center gap-2">
              <Users className="size-4 text-primary" /> Asignar a (selecciona uno o más) *
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
            {selectedUserIds.length > 1 && (
              <FieldDescription className="flex items-center gap-1 text-primary">
                <Users className="size-3" /> Se creará una copia de la tarea para cada co-responsable seleccionado.
              </FieldDescription>
            )}
          </FieldSet>
        )}

        {/* Recurrence */}
        <Field className="rounded-lg border bg-muted/40 p-4">
          <FieldLabel htmlFor={fid("recurrencia")} className="flex items-center gap-2"><RefreshCw className="size-4 text-primary" /> Recurrencia (Auto-Regeneración)</FieldLabel>
          <NativeSelect
            id={fid("recurrencia")}
            name="tipoRecurrencia"
            value={tipoRecurrencia}
            onChange={(e) => setTipoRecurrencia(e.target.value)}
            className="w-full"
          >
            <NativeSelectOption value="Unica">Solo una vez (Sin Recreación)</NativeSelectOption>
            <NativeSelectOption value="Diaria">Diaria (Se regenera cada día)</NativeSelectOption>
            <NativeSelectOption value="Semanal">Semanal (Día específico de la semana)</NativeSelectOption>
            <NativeSelectOption value="Mensual_Fecha">Mensual (Día exacto del mes)</NativeSelectOption>
            <NativeSelectOption value="Mensual_Ordinal">Mensual (Ej: Primer Viernes)</NativeSelectOption>
          </NativeSelect>

          {tipoRecurrencia === "Semanal" && (
            <Field className="mt-2">
              <FieldLabel htmlFor={fid("dia-semana")}>Día de la semana</FieldLabel>
              <NativeSelect id={fid("dia-semana")} name="diaDeLaSemana" defaultValue={isEdit ? (task.diaDeLaSemana ?? 1) : 1} className="w-full">
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
              <Input id={fid("dia-mes")} name="diaDelMes" type="number" min="1" max="31" defaultValue={isEdit ? (task.diaDelMes ?? 1) : 1} />
            </Field>
          )}

          {tipoRecurrencia === "Mensual_Ordinal" && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor={fid("ordinal")}>Orden</FieldLabel>
                <NativeSelect id={fid("ordinal")} name="ordinalSemana" defaultValue={isEdit ? (task.ordinalSemana ?? 1) : 1} className="w-full">
                  <NativeSelectOption value="1">Primer</NativeSelectOption>
                  <NativeSelectOption value="2">Segundo</NativeSelectOption>
                  <NativeSelectOption value="3">Tercer</NativeSelectOption>
                  <NativeSelectOption value="4">Cuarto</NativeSelectOption>
                  <NativeSelectOption value="-1">Último</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor={fid("ordinal-dia")}>Día</FieldLabel>
                <NativeSelect id={fid("ordinal-dia")} name="diaDeLaSemana" defaultValue={isEdit ? (task.diaDeLaSemana ?? 1) : 1} className="w-full">
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

          {tipoRecurrencia !== "Unica" && (
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

        {/* Time and Limits Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tipoRecurrencia === 'Unica' && (
            <Field>
              <FieldLabel htmlFor={fid("fecha")} className="flex items-center gap-2"><Calendar className="size-4 text-primary" /> Fecha Límite</FieldLabel>
              <Input id={fid("fecha")} required name="fecha" type="date" defaultValue={isEdit && task.fechaVencimiento ? new Date(task.fechaVencimiento).toISOString().split('T')[0] : ""} />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor={fid("hora")} className="flex items-center gap-2"><Clock className="size-4 text-primary" /> Hora Límite</FieldLabel>
            <Input id={fid("hora")} required name="hora" type="time" defaultValue={isEdit && task.horaEjecucion ? (() => { const d = new Date(task.horaEjecucion); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })() : ""} />
          </Field>

          <Field className={tipoRecurrencia === 'Unica' ? "sm:col-span-2" : ""}>
            <FieldLabel htmlFor={fid("tiempo")} className="flex items-center gap-2"><Clock className="size-4 text-primary" /> Tiempo Estimado (Minutos) *</FieldLabel>
            <Input id={fid("tiempo")} required name="tiempoMinutos" type="number" min="1" value={minutos} onChange={(e) => setMinutos(e.target.value)} placeholder="Ej: 15" />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor={fid("dificultad")} className="flex items-center gap-2"><Trophy className="size-4 text-primary" /> Dificultad</FieldLabel>
            <div
              id={fid("dificultad")}
              className="flex items-center gap-4"
              onPointerUpCapture={() => setNivel(nivelDe(dificultad))}
              onPointerCancelCapture={() => setNivel(nivelDe(dificultad))}
            >
              <SloshGauge
                value={nivel}
                onChange={(v) => { setNivel(v); setDificultad(dificultadDe(v)); }}
                interactive
                showValue={false}
                liquidColor={COLOR_DIFICULTAD[dificultad]}
                glassColor="#27272a"
                width={64}
                height={128}
                radius={16}
                ticks={4}
                ariaLabel="Dificultad de la tarea"
              />
              <ul className="flex flex-col-reverse gap-1 text-sm">
                {DIFICULTADES.map((d) => (
                  <li key={d} className={d === dificultad ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {DIFICULTAD_INFO[d].etiqueta} <span className="text-xs">— {DIFICULTAD_INFO[d].ejemplo}</span>
                  </li>
                ))}
              </ul>
            </div>
            <FieldDescription>
              {Number(minutos) > 0
                ? `Recompensa base: ${puntosBase(dificultad, Number(minutos) * 60)} pts (más bonos de racha, checklist y horario).`
                : "Ingresá el tiempo estimado para ver la recompensa base."}
            </FieldDescription>
          </Field>
        </div>

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
          <Checkbox name="isSurpriseEligible" id={`recompensa_${isEdit ? 'edit' : 'new'}`} defaultChecked={isEdit ? task.isSurpriseEligible : false} />
          <FieldLabel htmlFor={`recompensa_${isEdit ? 'edit' : 'new'}`} className="flex items-center gap-2 text-secondary">
            <Gift className="size-4" /> ¿Genera recompensas sorpresa al completarse?
          </FieldLabel>
        </Field>

        <Button disabled={loading} type="submit" size="lg" className="w-full">
          {loading ? (isEdit ? "Guardando..." : "Creando...") : (isEdit ? "Guardar Cambios" : "Registrar Tarea")}
        </Button>
      </FieldGroup>
    </form>
  );
}
