"use client";

// Propio de Ordo (lane 172, K1): alta y edición de una nota suelta (examen, proyecto, lectura, oral o tarea) en la libreta.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ETIQUETA_CALIFICACION, TIPOS_CALIFICACION, puntajeValido, type NotaLibreta, type TipoCalificacion } from "@/lib/homeschooling/calificaciones";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";
import ChipsPuntaje from "./ChipsPuntaje";

export type NotaEditable = NotaLibreta & { materiaId: number };

export default function NotaForm({
  open,
  alumnoId,
  materias,
  materiaInicial,
  editando,
  onClose,
  onGuardada,
}: {
  open: boolean;
  alumnoId: number;
  materias: { id: number; nombre: string }[];
  materiaInicial?: number | null;
  editando: NotaEditable | null;
  onClose: () => void;
  onGuardada: () => void;
}) {
  const [materiaId, setMateriaId] = useState<number>(0);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoCalificacion>("examen");
  const [puntaje, setPuntaje] = useState("");
  const [fecha, setFecha] = useState("");
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMateriaId(editando?.materiaId ?? materiaInicial ?? materias[0]?.id ?? 0);
    setTitulo(editando?.titulo ?? "");
    setTipo(editando?.tipo ?? "examen");
    setPuntaje(editando ? String(editando.puntaje) : "");
    setFecha(editando?.fecha ?? new Date().toLocaleDateString("sv-SE"));
    setComentario(editando?.comentario ?? "");
  }, [open, editando, materiaInicial, materias]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(puntaje);
    if (!puntajeValido(n) || !titulo.trim() || !materiaId) return;
    setGuardando(true);
    try {
      if (editando) await api(`/api/homeschooling/notas/${editando.id}`, { method: "PATCH", body: { titulo: titulo.trim(), tipo, puntaje: n, fecha, comentario: comentario.trim() || null } });
      else await api("/api/homeschooling/notas", { method: "POST", body: { alumnoId, materiaId, titulo: titulo.trim(), tipo, puntaje: n, fecha, comentario: comentario.trim() || null } });
      toast.success(editando ? "Nota actualizada" : "Nota agregada");
      onGuardada();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la nota");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar nota" : "Agregar nota"}</DialogTitle>
          <DialogDescription>Un examen, un proyecto, una lectura o una exposición oral.</DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nota-materia">Materia</Label>
              <NativeSelect id="nota-materia" className="w-full" value={materiaId} disabled={!!editando} onChange={(e) => setMateriaId(Number(e.target.value))}>
                {materias.map((m) => (
                  <NativeSelectOption key={m.id} value={m.id}>
                    {m.nombre}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nota-tipo">Tipo</Label>
              <NativeSelect id="nota-tipo" className="w-full" value={tipo} onChange={(e) => setTipo(e.target.value as TipoCalificacion)}>
                {TIPOS_CALIFICACION.map((t) => (
                  <NativeSelectOption key={t} value={t}>
                    {ETIQUETA_CALIFICACION[t]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nota-titulo">Título</Label>
            <Input id="nota-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150} placeholder="Examen de fracciones" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nota-puntaje">Nota</Label>
            <ChipsPuntaje id="nota-puntaje" valor={puntaje} onChange={setPuntaje} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nota-fecha">Fecha</Label>
            <Input id="nota-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nota-comentario">Comentario (opcional)</Label>
            <Textarea id="nota-comentario" rows={2} maxLength={1000} value={comentario} onChange={(e) => setComentario(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || !titulo.trim() || puntaje === "" || !puntajeValido(Number(puntaje)) || !materiaId}>
              {guardando && <Spinner />} {editando ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
