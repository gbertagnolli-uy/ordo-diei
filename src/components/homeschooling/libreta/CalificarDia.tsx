"use client";

// Propio de Ordo (lane 172, K1): la nota de un día de clase, desde el calendario del plan o la revisión. Trae la nota que ya había.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { puntajeValido } from "@/lib/homeschooling/calificaciones";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";
import ChipsPuntaje from "./ChipsPuntaje";

export default function CalificarDia({ diaId, titulo, onClose, onGuardada }: { diaId: number | null; titulo: string; onClose: () => void; onGuardada?: () => void }) {
  const [puntaje, setPuntaje] = useState("");
  const [comentario, setComentario] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (diaId === null) return;
    let vigente = true;
    api<{ puntaje: number; comentario: string | null } | null>(`/api/homeschooling/dias/${diaId}/nota`)
      .then((n) => {
        if (!vigente) return;
        setPuntaje(n ? String(n.puntaje) : "");
        setComentario(n?.comentario ?? "");
      })
      .catch(() => {})
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
      setCargando(true);
      setPuntaje("");
      setComentario("");
    };
  }, [diaId]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(puntaje);
    if (diaId === null || !puntajeValido(n)) return;
    setGuardando(true);
    try {
      await api(`/api/homeschooling/dias/${diaId}/nota`, { method: "PUT", body: { puntaje: n, comentario: comentario.trim() || null } });
      toast.success("Nota guardada");
      onGuardada?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la nota");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={diaId !== null} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Calificar</DialogTitle>
          <DialogDescription>{titulo}</DialogDescription>
        </DialogHeader>
        {cargando ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={guardar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cal-puntaje">Nota</Label>
              <ChipsPuntaje id="cal-puntaje" valor={puntaje} onChange={setPuntaje} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cal-comentario">Comentario (opcional)</Label>
              <Textarea id="cal-comentario" rows={3} maxLength={1000} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Qué salió bien y qué repasar" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando || !puntajeValido(Number(puntaje)) || puntaje === ""}>
                {guardando && <Spinner />} Guardar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
