"use client";

// Portado de vendor/roost/src/components/groups/CreateGroupModal.tsx (msrbuilds/roost@492af47).
// Cambios: reducido a nombre, descripción, portada, ícono, color de tema y dificultad (sin slug, privacidad, premium
// ni layout); Dialog de ui/; textos en español.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { DIFICULTADES, DIFICULTAD_INFO } from "@/lib/recompensaTarea";
import { createGroup, updateGroup } from "@/lib/homeschooling/roost/services/group";
import type { Group } from "@/lib/homeschooling/roost/tipos";
import { toast } from "@/lib/toast";
import PortadaCampo from "./PortadaCampo";
import { COLORES_MATERIA, ICONOS_MATERIA, iconoDe } from "./iconos";

export default function MateriaForm({
  open,
  onClose,
  onSuccess,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (g: Group) => void;
  editing?: Group | null;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [portada, setPortada] = useState("");
  const [icono, setIcono] = useState("BookOpen");
  const [color, setColor] = useState("primary");
  const [dificultad, setDificultad] = useState<Group["dificultad"]>("Media");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre(editing?.name ?? "");
    setDescripcion(editing?.description ?? "");
    setPortada(editing?.cover_url ?? "");
    setIcono(editing?.icon ?? "BookOpen");
    setColor(editing?.color ?? "primary");
    setDificultad(editing?.dificultad ?? "Media");
  }, [open, editing]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      const datos = { name: nombre.trim(), description: descripcion.trim() || null, cover_url: portada || null, icon: icono, color, dificultad };
      onSuccess(editing ? await updateGroup(editing.id, datos) : await createGroup(datos));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la materia");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar materia" : "Nueva materia"}</DialogTitle>
          <DialogDescription>La dificultad se copia a cada lección del día y define cuántos puntos da.</DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          <PortadaCampo url={portada} onChange={setPortada} />
          <div className="space-y-1.5">
            <Label htmlFor="mat-nombre">Nombre</Label>
            <Input id="mat-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Historia" maxLength={100} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mat-desc">Descripción</Label>
            <Textarea id="mat-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mat-dif">Dificultad</Label>
              <NativeSelect id="mat-dif" className="w-full" value={dificultad} onChange={(e) => setDificultad(e.target.value as Group["dificultad"])}>
                {DIFICULTADES.map((d) => (
                  <option key={d} value={d}>
                    {DIFICULTAD_INFO[d].etiqueta}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-color">Color</Label>
              <NativeSelect id="mat-color" className="w-full" value={color} onChange={(e) => setColor(e.target.value)}>
                {COLORES_MATERIA.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.etiqueta}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ícono</Label>
            <div className="flex flex-wrap gap-1.5">
              {ICONOS_MATERIA.map((nombreIcono) => {
                const Icono = iconoDe(nombreIcono);
                return (
                  <button
                    key={nombreIcono}
                    type="button"
                    aria-label={nombreIcono}
                    aria-pressed={icono === nombreIcono}
                    onClick={() => setIcono(nombreIcono)}
                    className={`rounded-lg border p-2 transition-colors ${icono === nombreIcono ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <Icono className="size-5" />
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || !nombre.trim()}>
              {guardando && <Spinner />} {editing ? "Guardar cambios" : "Crear materia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
