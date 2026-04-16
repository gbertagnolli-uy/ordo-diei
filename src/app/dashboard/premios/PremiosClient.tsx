"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Gift, CheckCircle, Clock, XCircle, HelpCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Premio {
  id: number;
  titulo: string;
  cantidad: number;
  tipoFrecuencia: string;
  diaEntregaSemana: number | null;
  diaDelMes: number | null;
  tareasRequeridasIds: string;
  activo: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  entregas: Entrega[];
}

interface Entrega {
  id: number;
  premioId: number;
  usuarioId: number;
  estado: string;
  fechaEntrega: string | null;
  usuario?: {
    id: number;
    nombre: string;
    rolFamiliar: string;
    fotoUrl: string | null;
  };
}

export function PremiosClient({ premios, tareas, usuarios }: { premios: Premio[]; tareas: any[]; usuarios: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingPremio, setEditingPremio] = useState<Premio | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    cantidad: 0,
    tipoFrecuencia: "Semanal",
    diaEntregaSemana: 1,
    diaDelMes: 1,
    tareasRequeridasIds: [] as number[],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingPremio ? `/api/premios/${editingPremio.id}` : "/api/premios";
      const method = editingPremio ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este premio? Los premios entregados no se pueden eliminar.")) return;
    
    try {
      const res = await fetch(`/api/premios/${id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar");
      }
    } catch {
      alert("Error de conexión");
    }
  };

  const openEditModal = (premio: Premio) => {
    setEditingPremio(premio);
    setFormData({
      titulo: premio.titulo,
      cantidad: premio.cantidad,
      tipoFrecuencia: premio.tipoFrecuencia,
      diaEntregaSemana: premio.diaEntregaSemana || 1,
      diaDelMes: premio.diaDelMes || 1,
      tareasRequeridasIds: JSON.parse(premio.tareasRequeridasIds || "[]"),
    });
    setShowModal(true);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "Entregado":
        return <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-[color-mix(in-srgb,var(--success)_10%,transparent)] text-[var(--success)]"><CheckCircle className="w-3 h-3"/> Entregado</span>;
      case "Pendiente":
        return <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] text-[var(--warning)]"><Clock className="w-3 h-3"/> Pendiente</span>;
      case "No_ganado":
        return <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-[color-mix(in-srgb,var(--error)_10%,transparent)] text-[var(--error)]"><XCircle className="w-3 h-3"/> No ganado</span>;
      default:
        return <span className="px-2 py-1 rounded-md text-xs font-bold bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">{estado}</span>;
    }
  };

  const getFrecuenciaLabel = (tipo: string, diaSemana: number | null, diaMes: number | null) => {
    if (tipo === "Semanal") {
      const dias = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      return `Semanal (${dias[diaSemana || 1]})`;
    }
    if (tipo === "Mensual") {
      return `Mensual (día ${diaMes})`;
    }
    return tipo;
  };

  const getTareasRequeridas = (ids: string) => {
    try {
      const arr = JSON.parse(ids || "[]") as number[];
      return tareas.filter(t => arr.includes(t.id)).map(t => t.titulo);
    } catch {
      return [];
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => { setEditingPremio(null); setFormData({ titulo: "", cantidad: 0, tipoFrecuencia: "Semanal", diaEntregaSemana: 1, diaDelMes: 1, tareasRequeridasIds: [] }); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nuevo Premio
        </button>
      </div>

      <div className="overflow-x-auto w-full custom-scrollbar rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] bg-[var(--surface-container-lowest)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] text-sm tracking-wider uppercase font-title font-bold">
              <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Premio</th>
              <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Frecuencia</th>
              <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Tareas Requeridas</th>
              <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Entregas</th>
              <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-[var(--on-surface)] font-body">
            {premios.map(premio => (
              <tr key={premio.id} className="border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] hover:bg-[var(--surface-container-low)] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-container)] flex items-center justify-center">
                      <Gift className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <div className="font-title font-bold">{premio.titulo}</div>
                      <div className="text-sm text-[var(--on-surface-variant)]">x{premio.cantidad}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm">{getFrecuenciaLabel(premio.tipoFrecuencia,premio.diaEntregaSemana,premio.diaDelMes)}</span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {getTareasRequeridas(premio.tareasRequeridasIds).length > 0 ? (
                      getTareasRequeridas(premio.tareasRequeridasIds).slice(0, 2).map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--on-surface-variant)]">Sin tareas</span>
                    )}
                    {getTareasRequeridas(premio.tareasRequeridasIds).length > 2 && (
                      <span className="px-2 py-0.5 rounded-md text-xs bg-[var(--surface-container-low)] text-[var(--primary)] font-bold">
                        +{getTareasRequeridas(premio.tareasRequeridasIds).length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    {premio.entregas.length > 0 ? (
                      premio.entregas.slice(0, 3).map(e => (
                        <div key={e.id} className="flex items-center gap-2 text-xs">
                          {getStatusBadge(e.estado)}
                          <span className="text-[var(--on-surface-variant)]">{e.usuario?.nombre || "Usuario"}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--on-surface-variant)]">Sin entregas</span>
                    )}
                    {premio.entregas.length > 3 && (
                      <span className="text-xs text-[var(--primary)] font-bold">+{premio.entregas.length - 3} más</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(premio)}
                      className="p-2 rounded-md hover:bg-[var(--surface-container-low)] text-[var(--primary)] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(premio.id)}
                      className="p-2 rounded-md hover:bg-[var(--surface-container-low)] text-[var(--error)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {premios.length === 0 && (
          <div className="p-16 text-center text-[var(--on-surface-variant)] flex flex-col items-center gap-2 font-bold font-title text-lg">
            <Gift className="w-12 h-12 text-[var(--outline)]" /> No hay premios configurados.
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPremio ? "Editar Premio" : "Nuevo Premio"} width="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-title font-bold text-[var(--on-surface)] mb-2">Título del Premio</label>
            <input
              type="text"
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full bg-[var(--surface-container-low)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] p-3 outline-none text-[var(--on-surface)] font-body"
              placeholder="ej. Monedas de Oro"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-title font-bold text-[var(--on-surface)] mb-2">Cantidad</label>
            <input
              type="number"
              value={formData.cantidad}
              onChange={e => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
              className="w-full bg-[var(--surface-container-low)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] p-3 outline-none text-[var(--on-surface)] font-body"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-title font-bold text-[var(--on-surface)] mb-2">Frecuencia</label>
            <select
              value={formData.tipoFrecuencia}
              onChange={e => setFormData({ ...formData, tipoFrecuencia: e.target.value })}
              className="w-full bg-[var(--surface-container-low)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] p-3 outline-none text-[var(--on-surface)] font-body"
            >
              <option value="Semanal">Semanal</option>
              <option value="Mensual">Mensual</option>
            </select>
          </div>

          {formData.tipoFrecuencia === "Semanal" && (
            <div>
              <label className="block text-sm font-title font-bold text-[var(--on-surface)] mb-2">Día de Entrega</label>
              <select
                value={formData.diaEntregaSemana}
                onChange={e => setFormData({ ...formData, diaEntregaSemana: parseInt(e.target.value) })}
                className="w-full bg-[var(--surface-container-low)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] p-3 outline-none text-[var(--on-surface)] font-body"
              >
                <option value={1}>Lunes</option>
                <option value={2}>Martes</option>
                <option value={3}>Miércoles</option>
                <option value={4}>Jueves</option>
                <option value={5}>Viernes</option>
                <option value={6}>Sábado</option>
                <option value={7}>Domingo</option>
              </select>
            </div>
          )}

          {formData.tipoFrecuencia === "Mensual" && (
            <div>
              <label className="block text-sm font-title font-bold text-[var(--on-surface)] mb-2">Día del Mes</label>
              <select
                value={formData.diaDelMes}
                onChange={e => setFormData({ ...formData, diaDelMes: parseInt(e.target.value) })}
                className="w-full bg-[var(--surface-container-low)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] p-3 outline-none text-[var(--on-surface)] font-body"
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-title font-bold text-[var(--on-surface)] mb-2">Tareas Requeridas (selecciona múltiples)</label>
            <div className="max-h-40 overflow-y-auto bg-[var(--surface-container-low)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] p-3">
              {tareas.map(tarea => (
                <label key={tarea.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tareasRequeridasIds.includes(tarea.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setFormData({ ...formData, tareasRequeridasIds: [...formData.tareasRequeridasIds, tarea.id] });
                      } else {
                        setFormData({ ...formData, tareasRequeridasIds: formData.tareasRequeridasIds.filter(id => id !== tarea.id) });
                      }
                    }}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--on-surface)]">{tarea.titulo}</span>
                </label>
              ))}
              {tareas.length === 0 && (
                <div className="text-sm text-[var(--on-surface-variant)]">No hay tareas disponibles</div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-2"
          >
            {loading ? "Guardando..." : editingPremio ? "Actualizar Premio" : "Crear Premio"}
          </button>
        </form>
      </Modal>
    </div>
  );
}