"use client";

import { useState, useSyncExternalStore } from "react";
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
import Stepper, { Step } from "@/components/Stepper";
import { DIFICULTADES, DIFICULTAD_DEFAULT, DIFICULTAD_INFO, puntosBase, type Dificultad } from "@/lib/recompensaTarea";
import { toast } from "@/lib/toast";

const COLOR_DIFICULTAD: Record<Dificultad, string> = { Facil: "#4ade80", Media: "#facc15", Dificil: "#fb923c", Ardua: "#f87171" };

const leerTema = () => (document.documentElement.classList.contains("dark") ? "dark" : "light") as "dark" | "light";
const suscribirTema = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
};

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
  const tema = useSyncExternalStore(suscribirTema, leerTema, () => "light" as const);

  const toggleUser = (id: number) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  /** Devuelve el mensaje de error del paso, o null si está completo. */
  const validar = (n: number): string | null => {
    if (n === 1 && !titulo.trim()) return "Ponele un título a la tarea.";
    if (n === 2 && !isGlobal && selectedUserIds.length === 0) return "Selecciona al menos un usuario o activa la tarea global.";
    if (n === 3) {
      if (tipoRecurrencia === "Unica" && !fecha) return "Elegí la fecha límite.";
      if (!hora) return "Elegí la hora límite.";
    }
    if (n === 4 && !(Number(minutos) > 0)) return "Ingresá el tiempo estimado en minutos.";
    return null;
  };

  const enviar = async () => {
    setLoading(true);
    const comun = {
      titulo,
      descripcion,
      tiempoMinutos: minutos,
      fecha: tipoRecurrencia === "Unica" ? fecha : null,
      hora,
      tipoRecurrencia,
      diaDelMes: tipoRecurrencia === "Mensual_Fecha" ? diaMes : null,
      ordinalSemana: tipoRecurrencia === "Mensual_Ordinal" ? ordinal : null,
      diaDeLaSemana: tipoRecurrencia === "Semanal" || tipoRecurrencia === "Mensual_Ordinal" ? diaSemana : null,
      intervalo,
      anclaCompletado: anclajeCompletado,
      generaRecompensa: true,
      dificultad,
      isSurpriseEligible: sorpresa,
      checklistItems: isChecklist ? checklistItems.filter(i => i.trim()) : [],
    };

    try {
      if (isEdit) {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...comun, asignadoIds: selectedUserIds }),
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

    </FieldGroup>
  );

  const seccionCuando = (
    <FieldGroup>
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


        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tipoRecurrencia === 'Unica' && (
            <Field>
              <FieldLabel htmlFor={fid("fecha")} className="flex items-center gap-2"><Calendar className="size-4 text-primary" /> Fecha Límite</FieldLabel>
              <Input id={fid("fecha")} required name="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
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
          <div id={fid("dificultad")} className="flex items-center gap-4">
            <SloshGauge
              value={(DIFICULTADES.indexOf(dificultad) + 1) * 25}
              onChange={(v) => setDificultad(DIFICULTADES[Math.min(3, Math.max(0, Math.ceil(v / 25) - 1))])}
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
      theme={tema}
      style={{ "--stepper-solid": "var(--primary)", "--stepper-solid-ink": "var(--primary-foreground)" } as React.CSSProperties}
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
