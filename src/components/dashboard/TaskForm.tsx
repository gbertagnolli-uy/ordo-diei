"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, Gift, RefreshCw, Globe, Users, ListChecks, Plus, Trash2 } from "lucide-react";

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
    isEdit ? [task.asignadoId] : []
  );
  const [isGlobal, setIsGlobal] = useState(false);
  const [tipoRecurrencia, setTipoRecurrencia] = useState(
    isEdit ? (task.tipoRecurrencia || "Unica") : "Unica"
  );
  const [isChecklist, setIsChecklist] = useState(isEdit ? (task.isChecklist || false) : false);
  const [checklistItems, setChecklistItems] = useState<string[]>(
    isEdit && task.checklistItems ? task.checklistItems.map((ci: any) => ci.texto) : []
  );
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const toggleUser = (id: number) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEdit && !isGlobal && selectedUserIds.length === 0) {
      alert("Selecciona al menos un usuario o activa la tarea global.");
      return;
    }
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    if (isEdit) {
      // EDIT mode
      const body: any = {
        titulo: formData.get("titulo"),
        descripcion: formData.get("descripcion"),
        asignadoId: formData.get("asignadoId") || task.asignadoId,
        tiempoMinutos: formData.get("tiempoMinutos"),
        fecha: formData.get("fecha"),
        hora: formData.get("hora"),
        tipoRecurrencia: tipoRecurrencia,
        diaDelMes: formData.get("diaDelMes"),
        ordinalSemana: formData.get("ordinalSemana"),
        diaDeLaSemana: formData.get("diaDeLaSemana"),
        generaRecompensa: true,
        isSurpriseEligible: formData.get("isSurpriseEligible") === "on",
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
          alert("Error al actualizar la tarea");
        }
      } catch {
        alert("Error de conexión");
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
        generaRecompensa: true,
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
          alert(error.error || "Error al crear la tarea");
        }
      } catch {
        alert("Hubo un error de conexión");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-6 ${isModal ? 'max-h-[70vh] overflow-y-auto px-1 custom-scrollbar' : ''}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="font-label text-[var(--on-surface-variant)] mb-1 block">Título de la Tarea *</label>
          <input required name="titulo" type="text" defaultValue={isEdit ? task.titulo : ""} className="w-full inkpot-filled" placeholder="Ej: Recoger los juguetes" />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="font-label text-[var(--on-surface-variant)] mb-1 block">Descripción (Opcional)</label>
          <textarea name="descripcion" rows={3} defaultValue={isEdit ? (task.descripcion || "") : ""} className="w-full inkpot-filled placeholder-[var(--on-surface-variant)]" placeholder="Asegúrate de dejar la caja ordenada..." />
        </div>

        {/* EDIT: Single user selector */}
        {isEdit && (
          <div>
            <label className="font-label text-[var(--on-surface-variant)] mb-1 block">Asignado a</label>
            <select required name="asignadoId" defaultValue={task.asignadoId} className="w-full inkpot-filled">
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.rolFamiliar.replace("_", " ")})</option>
              ))}
            </select>
          </div>
        )}

        {/* CREATE: Global toggle */}
        {!isEdit && (
          <div className="sm:col-span-2 flex items-center gap-4 p-4 bg-[color-mix(in-srgb,var(--primary)_6%,transparent)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
            <Globe className="w-6 h-6 text-[var(--primary)] shrink-0" />
            <div className="flex-1">
              <label className="font-title text-[var(--on-surface)] block">Tarea Global</label>
              <p className="font-body text-xs text-[var(--on-surface-variant)] mt-1">Se asignará automáticamente a todos los miembros de la familia.</p>
            </div>
            <button
              type="button"
              onClick={() => { setIsGlobal(!isGlobal); if (!isGlobal) setSelectedUserIds([]); }}
              className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${isGlobal ? 'bg-[var(--primary)]' : 'bg-[var(--surface-container-highest)]'}`}
            >
              <div className={`w-6 h-6 bg-[var(--on-primary)] rounded-full absolute top-1 transition-all shadow-sm ${isGlobal ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        )}

        {/* CREATE: Multi-select users */}
        {!isEdit && !isGlobal && (
          <div className="sm:col-span-2">
            <label className="font-label text-[var(--on-surface-variant)] mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--primary)]" /> Asignar a (selecciona uno o más) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {users.map(u => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={`flex items-center gap-3 p-3 rounded-md border transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[color-mix(in-srgb,var(--primary)_6%,transparent)] elevation-ambient'
                        : 'border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] bg-[var(--surface-container-lowest)] hover:border-[var(--outline)]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 transition-all ${isSelected ? 'ring-[var(--primary)]' : 'ring-transparent'}`}>
                      {u.fotoUrl ? (
                        <img src={u.fotoUrl} alt={u.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[var(--primary)] flex items-center justify-center text-[var(--on-primary)] font-title text-sm">
                          {u.nombre.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <div className={`font-title text-sm truncate ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--on-surface)]'}`}>{u.nombre}</div>
                      <div className="font-body text-xs text-[var(--on-surface-variant)] mt-0.5">{u.rolFamiliar.replace("_", " ")}</div>
                    </div>
                    {isSelected && (
                      <div className="ml-auto w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center text-[var(--on-primary)] text-xs font-bold shrink-0">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedUserIds.length > 1 && (
              <p className="font-body text-[var(--primary)] text-xs mt-3 flex items-center gap-1">
                <Users className="w-3 h-3" /> Se creará una copia de la tarea para cada co-responsable seleccionado.
              </p>
            )}
          </div>
        )}

        {/* Recurrence */}
        <div className="sm:col-span-2 p-4 bg-[color-mix(in-srgb,var(--primary)_6%,transparent)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] flex items-start gap-4">
          <RefreshCw className="w-6 h-6 text-[var(--primary)] shrink-0 mt-1" />
          <div className="w-full">
            <label className="font-title text-[var(--on-surface)] mb-1 block">Recurrencia (Auto-Regeneración)</label>
            <select 
              name="tipoRecurrencia" 
              value={tipoRecurrencia}
              onChange={(e) => setTipoRecurrencia(e.target.value)}
              className="w-full inkpot-filled cursor-pointer"
            >
              <option value="Unica">Solo una vez (Sin Recreación)</option>
              <option value="Diaria">Diaria (Se regenera cada día)</option>
              <option value="Semanal">Semanal (Día específico de la semana)</option>
              <option value="Mensual_Fecha">Mensual (Día exacto del mes)</option>
              <option value="Mensual_Ordinal">Mensual (Ej: Primer Viernes)</option>
            </select>

            {tipoRecurrencia === "Semanal" && (
              <div className="mt-3">
                <label className="font-label text-[var(--on-surface-variant)] mb-1 block">Día de la semana</label>
                <select name="diaDeLaSemana" defaultValue={isEdit ? (task.diaDeLaSemana ?? 1) : 1} className="w-full inkpot-filled cursor-pointer">
                  <option value="1">Lunes</option>
                  <option value="2">Martes</option>
                  <option value="3">Miércoles</option>
                  <option value="4">Jueves</option>
                  <option value="5">Viernes</option>
                  <option value="6">Sábado</option>
                  <option value="0">Domingo</option>
                </select>
              </div>
            )}

            {tipoRecurrencia === "Mensual_Fecha" && (
              <div className="mt-3">
                <label className="font-label text-[var(--on-surface-variant)] mb-1 block">Día del mes (1-31)</label>
                <input name="diaDelMes" type="number" min="1" max="31" defaultValue={isEdit ? (task.diaDelMes ?? 1) : 1} className="w-full inkpot-filled" />
              </div>
            )}

            {tipoRecurrencia === "Mensual_Ordinal" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label text-[var(--on-surface-variant)] mb-1 block">Orden</label>
                  <select name="ordinalSemana" defaultValue={isEdit ? (task.ordinalSemana ?? 1) : 1} className="w-full inkpot-filled cursor-pointer">
                    <option value="1">Primer</option>
                    <option value="2">Segundo</option>
                    <option value="3">Tercer</option>
                    <option value="4">Cuarto</option>
                    <option value="-1">Último</option>
                  </select>
                </div>
                <div>
                  <label className="font-label text-[var(--on-surface-variant)] mb-1 block">Día</label>
                  <select name="diaDeLaSemana" defaultValue={isEdit ? (task.diaDeLaSemana ?? 1) : 1} className="w-full inkpot-filled cursor-pointer">
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                    <option value="6">Sábado</option>
                    <option value="0">Domingo</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time and Limits Row */}
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Date (only for Unica) */}
          {tipoRecurrencia === 'Unica' && (
            <div>
              <label className="font-label text-[var(--on-surface-variant)] mb-1 flex items-center gap-2"><Calendar className="w-4 h-4 text-[var(--primary)]"/> Fecha Límite</label>
              <input required name="fecha" type="date" defaultValue={isEdit && task.fechaVencimiento ? new Date(task.fechaVencimiento).toISOString().split('T')[0] : ""} className="w-full inkpot-filled" />
            </div>
          )}

          {/* Time (always visible) */}
          <div>
            <label className="font-label text-[var(--on-surface-variant)] mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--primary)]"/> Hora Límite</label>
            <input required name="hora" type="time" defaultValue={isEdit && task.horaEjecucion ? (() => { const d = new Date(task.horaEjecucion); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })() : ""} className="w-full inkpot-filled" />
          </div>

          <div className={tipoRecurrencia === 'Unica' ? "sm:col-span-2" : "sm:col-span-1"}>
            <label className="font-label text-[var(--on-surface-variant)] mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--primary)]"/> Tiempo Estimado (Minutos) *</label>
            <input required name="tiempoMinutos" type="number" min="1" defaultValue={isEdit ? Math.floor(task.tiempoEjecucionEstimadoSeg / 60) : ""} className="w-full inkpot-filled" placeholder="Ej: 15" />
          </div>
        </div>


        {/* Checklist */}
        <div className="sm:col-span-2 p-4 bg-[color-mix(in-srgb,var(--success)_6%,transparent)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] flex items-start gap-4">
          <ListChecks className="w-6 h-6 text-[var(--success)] shrink-0 mt-1" />
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <label className="font-title text-[var(--on-surface)] block">¿Es checklist?</label>
              <button
                type="button"
                onClick={() => { setIsChecklist(!isChecklist); if (isChecklist) setChecklistItems([]); }}
                className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${isChecklist ? 'bg-[var(--success)]' : 'bg-[var(--surface-container-highest)]'}`}
              >
                <div className={`w-6 h-6 bg-[var(--on-primary)] rounded-full absolute top-1 transition-all shadow-sm ${isChecklist ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            {isChecklist && (
              <div className="space-y-2 mt-4">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-body text-sm text-[var(--on-surface-variant)] w-6 text-right">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...checklistItems];
                        updated[idx] = e.target.value;
                        setChecklistItems(updated);
                      }}
                      className="flex-1 inkpot"
                    />
                    <button type="button" onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))} className="text-[var(--error)] hover:opacity-80 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <input
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
                    className="flex-1 inkpot-filled"
                  />
                  <button type="button" onClick={() => { if (newChecklistItem.trim()) { setChecklistItems([...checklistItems, newChecklistItem.trim()]); setNewChecklistItem(""); } }} className="bg-[var(--primary)] text-[var(--on-primary)] p-2 rounded-md shadow-[inset_0_0.5px_0_rgba(118,91,5,0.3)] hover:bg-[var(--primary-container)] transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Surprise toggle */}
        <div className="sm:col-span-2 flex items-center gap-4 p-4 bg-[color-mix(in-srgb,var(--secondary)_6%,transparent)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] cursor-pointer hover:bg-[color-mix(in-srgb,var(--secondary)_10%,transparent)] transition-colors">
          <input type="checkbox" name="isSurpriseEligible" id={`recompensa_${isEdit ? 'edit' : 'new'}`} defaultChecked={isEdit ? task.isSurpriseEligible : false} className="w-6 h-6 rounded border-[var(--outline)] text-[var(--secondary)] focus:ring-[var(--secondary)]" />
          <label htmlFor={`recompensa_${isEdit ? 'edit' : 'new'}`} className="flex items-center gap-2 cursor-pointer font-title text-[var(--secondary)] select-none w-full">
            <Gift className="w-5 h-5" /> ¿Genera recompensas sorpresa al completarse?
          </label>
        </div>
      </div>

      <button disabled={loading} type="submit" className="w-full mt-4 btn-primary flex justify-center items-center gap-2 text-lg">
        {loading ? (isEdit ? "Guardando..." : "Creando...") : (isEdit ? "Guardar Cambios" : "Registrar Tarea")}
      </button>
    </form>
  );
}
