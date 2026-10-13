"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Gift, CheckCircle, Clock, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { ValesAdmin } from "@/components/recompensas/ValesAdmin";

interface Premio {
  id: number;
  titulo: string;
  cantidad: number;
  tipoFrecuencia: string;
  diaEntregaSemana: number | null;
  diaDelMes: number | null;
  tareasRequeridasIds: string;
  activo: boolean;
  esVale: boolean;
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
    esVale: false,
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
        toast.error(data.error || "Error al guardar");
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
        toast.error(data.error || "Error al eliminar");
      }
    } catch {
      toast.error("Error de conexión");
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
      esVale: premio.esVale,
    });
    setShowModal(true);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "Entregado":
        return <Badge variant="outline" className="gap-1 border-[color-mix(in_srgb,var(--success)_30%,transparent)] text-[var(--success)]"><CheckCircle /> Entregado</Badge>;
      case "Pendiente":
        return <Badge variant="outline" className="gap-1 border-[color-mix(in_srgb,var(--warning)_30%,transparent)] text-[var(--warning)]"><Clock /> Pendiente</Badge>;
      case "No_ganado":
        return <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive"><XCircle /> No ganado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
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
    <div className="flex flex-1 flex-col">
      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-4">
          <CardTitle className="text-base">{premios.length} {premios.length === 1 ? "premio" : "premios"}</CardTitle>
          <Button
            onClick={() => { setEditingPremio(null); setFormData({ titulo: "", cantidad: 0, tipoFrecuencia: "Semanal", diaEntregaSemana: 1, diaDelMes: 1, tareasRequeridasIds: [], esVale: false }); setShowModal(true); }}
          >
            <Plus /> Nuevo Premio
          </Button>
        </CardHeader>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="pl-6">Premio</TableHead>
              <TableHead>Frecuencia</TableHead>
              <TableHead>Tareas Requeridas</TableHead>
              <TableHead>Entregas</TableHead>
              <TableHead className="pr-6 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {premios.map(premio => (
              <TableRow key={premio.id}>
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Gift className="size-4" />
                    </span>
                    <div>
                      <div className="font-medium">{premio.esVale ? `Vale por ${premio.titulo}` : premio.titulo}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">{premio.esVale ? "Vale" : `x${premio.cantidad}`}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{getFrecuenciaLabel(premio.tipoFrecuencia,premio.diaEntregaSemana,premio.diaDelMes)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getTareasRequeridas(premio.tareasRequeridasIds).length > 0 ? (
                      getTareasRequeridas(premio.tareasRequeridasIds).slice(0, 2).map((t, i) => (
                        <Badge key={i} variant="outline">{t}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin tareas</span>
                    )}
                    {getTareasRequeridas(premio.tareasRequeridasIds).length > 2 && (
                      <Badge variant="secondary">+{getTareasRequeridas(premio.tareasRequeridasIds).length - 2}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {premio.entregas.length > 0 ? (
                      premio.entregas.slice(0, 3).map(e => (
                        <div key={e.id} className="flex items-center gap-2 text-xs">
                          {getStatusBadge(e.estado)}
                          <span className="text-muted-foreground">{e.usuario?.nombre || "Usuario"}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin entregas</span>
                    )}
                    {premio.entregas.length > 3 && (
                      <span className="text-xs font-medium text-primary">+{premio.entregas.length - 3} más</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditModal(premio)} aria-label="Editar">
                      <Edit2 />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(premio.id)} aria-label="Eliminar" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {premios.length === 0 && (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Gift /></EmptyMedia>
              <EmptyTitle>No hay premios configurados.</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </Card>

      <ValesAdmin />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPremio ? "Editar Premio" : "Nuevo Premio"} width="md">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="premio-titulo">Título del Premio</FieldLabel>
              <Input
                id="premio-titulo"
                type="text"
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                placeholder={formData.esVale ? "ej. un helado en la heladería" : "ej. Monedas de Oro"}
                required
              />
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="premio-es-vale"
                checked={formData.esVale}
                onCheckedChange={checked => setFormData({ ...formData, esVale: checked === true, cantidad: checked === true ? 1 : formData.cantidad })}
              />
              <FieldLabel htmlFor="premio-es-vale" className="font-normal">Es un vale (voucher canjeable: el título sigue a «Vale por…»)</FieldLabel>
            </Field>

            <Field>
              <FieldLabel htmlFor="premio-cantidad">Cantidad</FieldLabel>
              <Input
                id="premio-cantidad"
                type="number"
                value={formData.cantidad}
                onChange={e => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                min="1"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="premio-frecuencia">Frecuencia</FieldLabel>
              <NativeSelect
                id="premio-frecuencia"
                className="w-full"
                value={formData.tipoFrecuencia}
                onChange={e => setFormData({ ...formData, tipoFrecuencia: e.target.value })}
              >
                <NativeSelectOption value="Semanal">Semanal</NativeSelectOption>
                <NativeSelectOption value="Mensual">Mensual</NativeSelectOption>
              </NativeSelect>
            </Field>

            {formData.tipoFrecuencia === "Semanal" && (
              <Field>
                <FieldLabel htmlFor="premio-dia-semana">Día de Entrega</FieldLabel>
                <NativeSelect
                  id="premio-dia-semana"
                  className="w-full"
                  value={formData.diaEntregaSemana}
                  onChange={e => setFormData({ ...formData, diaEntregaSemana: parseInt(e.target.value) })}
                >
                  <NativeSelectOption value={1}>Lunes</NativeSelectOption>
                  <NativeSelectOption value={2}>Martes</NativeSelectOption>
                  <NativeSelectOption value={3}>Miércoles</NativeSelectOption>
                  <NativeSelectOption value={4}>Jueves</NativeSelectOption>
                  <NativeSelectOption value={5}>Viernes</NativeSelectOption>
                  <NativeSelectOption value={6}>Sábado</NativeSelectOption>
                  <NativeSelectOption value={7}>Domingo</NativeSelectOption>
                </NativeSelect>
              </Field>
            )}

            {formData.tipoFrecuencia === "Mensual" && (
              <Field>
                <FieldLabel htmlFor="premio-dia-mes">Día del Mes</FieldLabel>
                <NativeSelect
                  id="premio-dia-mes"
                  className="w-full"
                  value={formData.diaDelMes}
                  onChange={e => setFormData({ ...formData, diaDelMes: parseInt(e.target.value) })}
                >
                  {Array.from({ length: 28 }, (_, i) => (
                    <NativeSelectOption key={i + 1} value={i + 1}>{i + 1}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            )}

            <Field>
              <FieldLabel>Tareas Requeridas (selecciona múltiples)</FieldLabel>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
                {tareas.map(tarea => (
                  <Field key={tarea.id} orientation="horizontal">
                    <Checkbox
                      id={`premio-tarea-${tarea.id}`}
                      checked={formData.tareasRequeridasIds.includes(tarea.id)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setFormData({ ...formData, tareasRequeridasIds: [...formData.tareasRequeridasIds, tarea.id] });
                        } else {
                          setFormData({ ...formData, tareasRequeridasIds: formData.tareasRequeridasIds.filter(id => id !== tarea.id) });
                        }
                      }}
                    />
                    <FieldLabel htmlFor={`premio-tarea-${tarea.id}`} className="font-normal">{tarea.titulo}</FieldLabel>
                  </Field>
                ))}
                {tareas.length === 0 && (
                  <div className="text-sm text-muted-foreground">No hay tareas disponibles</div>
                )}
              </div>
            </Field>

            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? "Guardando..." : editingPremio ? "Actualizar Premio" : "Crear Premio"}
            </Button>
          </FieldGroup>
        </form>
      </Modal>
    </div>
  );
}