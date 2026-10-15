"use client";

// Portado de vendor/roost/src/components/events/EventForm.tsx (msrbuilds/roost@492af47).
// Cambios: Dialog/Input/Label de ui/; materia y alumnos participantes; sin virtual, URL de reunión ni grupo;
// validación fin > inicio (era un CHECK en Roost); textos en español.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, updateEvent } from "@/lib/homeschooling/roost/services/event";
import type { EventWithDetails } from "@/lib/homeschooling/roost/tipos";
import { toast } from "@/lib/toast";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";

/** Date → valor de un input datetime-local (hora del navegador) */
const aLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function ActividadForm({
  open,
  onClose,
  onSuccess,
  materias,
  alumnos,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materias: { id: number; name: string }[];
  alumnos: AlumnoLite[];
  editing?: EventWithDetails | null;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [lugar, setLugar] = useState("");
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ahora = new Date();
    ahora.setMinutes(0, 0, 0);
    setTitulo(editing?.title ?? "");
    setDescripcion(editing?.description ?? "");
    setMateriaId(String(editing?.materia_id ?? materias[0]?.id ?? ""));
    setInicio(aLocal(editing ? new Date(editing.start_time) : ahora));
    setFin(aLocal(editing ? new Date(editing.end_time) : new Date(ahora.getTime() + 3600000)));
    setLugar(editing?.location ?? "");
    setElegidos(editing ? editing.participantes.map((p) => p.id) : alumnos.map((a) => a.id));
  }, [open, editing, materias, alumnos]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(fin) <= new Date(inicio)) {
      toast.error("El fin tiene que ser posterior al inicio");
      return;
    }
    if (elegidos.length === 0) {
      toast.error("Elegí al menos un alumno");
      return;
    }
    setGuardando(true);
    try {
      const datos = {
        materiaId: Number(materiaId),
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        inicio: new Date(inicio).toISOString(),
        fin: new Date(fin).toISOString(),
        lugar: lugar.trim() || null,
        alumnoIds: elegidos,
      };
      if (editing) await updateEvent(editing.id, datos);
      else await createEvent(datos);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la actividad");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar actividad" : "Nueva actividad"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ac-titulo">Título</Label>
            <Input id="ac-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Visita al museo" maxLength={150} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-materia">Materia</Label>
            <NativeSelect id="ac-materia" className="w-full" value={materiaId} onChange={(e) => setMateriaId(e.target.value)} required>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ac-inicio">Desde</Label>
              <Input id="ac-inicio" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-fin">Hasta</Label>
              <Input id="ac-fin" type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-lugar">Lugar</Label>
            <Input id="ac-lugar" value={lugar} onChange={(e) => setLugar(e.target.value)} maxLength={150} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-desc">Descripción</Label>
            <Textarea id="ac-desc" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={1000} />
          </div>
          <div className="space-y-2">
            <Label>Participaron</Label>
            {alumnos.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={elegidos.includes(a.id)} onCheckedChange={() => setElegidos((e) => (e.includes(a.id) ? e.filter((x) => x !== a.id) : [...e, a.id]))} /> {a.nombre}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || !titulo.trim() || !materiaId}>
              {guardando && <Spinner />} {editing ? "Guardar cambios" : "Crear actividad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
