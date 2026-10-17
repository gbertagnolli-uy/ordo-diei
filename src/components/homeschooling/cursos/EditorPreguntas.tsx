"use client";

// Propio de Ordo: editor del padre de las preguntas de una lección — de 2 a 4 opciones, la correcta, la explicación y,
// si se quiere que el video se pause, el segundo del checkpoint (sin segundo = parte del quiz final).

import { useEffect, useState } from "react";
import { KeyRound, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/homeschooling/roost/services/http";
import { validarPreguntas, type PreguntaEditable } from "@/lib/homeschooling/quiz";
import { toast } from "@/lib/toast";

type Borrador = { enunciado: string; opciones: string[]; correcta: number; explicacion: string; segundoVideo: string };

/** Índice de la opción correcta después de quitar la opción `k` (si era la correcta, pasa a la primera) */
const indiceTrasQuitar = (correcta: number, k: number) => (correcta === k ? 0 : correcta > k ? correcta - 1 : correcta);

const vacia = (): Borrador => ({ enunciado: "", opciones: ["", ""], correcta: 0, explicacion: "", segundoVideo: "" });

export default function EditorPreguntas({
  open,
  leccionId,
  titulo,
  onClose,
  onGuardado,
}: {
  open: boolean;
  leccionId: number;
  titulo: string;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [lista, setLista] = useState<Borrador[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    let vigente = true;
    setCargando(true);
    api<{ enunciado: string; opciones: string[]; correcta: number; explicacion: string | null; segundoVideo: number | null }[]>(`/api/homeschooling/lecciones/${leccionId}/preguntas?completas=1`)
      .then((ps) => vigente && setLista(ps.map((p) => ({ enunciado: p.enunciado, opciones: p.opciones, correcta: p.correcta, explicacion: p.explicacion ?? "", segundoVideo: p.segundoVideo === null ? "" : String(p.segundoVideo) }))))
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudieron cargar las preguntas"))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [open, leccionId]);

  const cambiar = (i: number, parche: Partial<Borrador>) => setLista((l) => l.map((p, n) => (n === i ? { ...p, ...parche } : p)));

  const guardar = async (abrirImpresion?: "alumno" | "clave") => {
    const preguntas: PreguntaEditable[] = lista.map((p) => ({
      enunciado: p.enunciado,
      opciones: p.opciones,
      correcta: p.correcta,
      explicacion: p.explicacion.trim() || null,
      segundoVideo: p.segundoVideo.trim() === "" ? null : Number(p.segundoVideo),
    }));
    const errores = validarPreguntas(preguntas);
    if (errores.length) {
      toast.error(errores[0]);
      return;
    }
    setGuardando(true);
    try {
      await api(`/api/homeschooling/lecciones/${leccionId}/preguntas`, { method: "PUT", body: { preguntas } });
      toast.success("Quiz / Evaluación guardado");
      onGuardado?.();
      if (abrirImpresion) {
        window.open(`/dashboard/homeschooling/imprimir/quiz/${leccionId}?modo=${abrirImpresion}`, "_blank");
      } else {
        onClose();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quiz y Evaluación de «{titulo}»</DialogTitle>
          <DialogDescription>
            Creá preguntas de opción múltiple para evaluar la clase (online o impresas en hoja A4). Si la clase tiene video y cargás el segundo, la pregunta pausa el video como checkpoint; si lo dejás vacío, forma parte del quiz/assessment final.
          </DialogDescription>
        </DialogHeader>

        {cargando ? (
          <div className="flex justify-center py-6">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {lista.map((p, i) => (
              <div key={i} className="space-y-3 rounded-xl border p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`pq-${i}`}>Pregunta {i + 1}</Label>
                    <Input id={`pq-${i}`} value={p.enunciado} onChange={(e) => cambiar(i, { enunciado: e.target.value })} maxLength={300} placeholder="¿Cuál fue la causa principal de…?" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label="Quitar pregunta" className="mt-6 text-destructive" onClick={() => setLista((l) => l.filter((_, n) => n !== i))}>
                    <Trash2 />
                  </Button>
                </div>
                <RadioGroup value={String(p.correcta)} onValueChange={(v) => cambiar(i, { correcta: Number(v) })}>
                  {p.opciones.map((o, k) => (
                    <div key={k} className="flex items-center gap-2">
                      <RadioGroupItem value={String(k)} id={`po-${i}-${k}`} aria-label={`Opción ${k + 1} correcta`} />
                      <Input value={o} onChange={(e) => cambiar(i, { opciones: p.opciones.map((x, n) => (n === k ? e.target.value : x)) })} placeholder={`Opción ${k + 1}`} maxLength={200} />
                      {p.opciones.length > 2 && (
                        <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar opción" onClick={() => cambiar(i, { opciones: p.opciones.filter((_, n) => n !== k), correcta: indiceTrasQuitar(p.correcta, k) })}>
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  ))}
                </RadioGroup>
                {p.opciones.length < 4 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => cambiar(i, { opciones: [...p.opciones, ""] })}>
                    <Plus /> Opción
                  </Button>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`pe-${i}`}>Explicación para la corrección (opcional)</Label>
                    <Textarea id={`pe-${i}`} rows={2} value={p.explicacion} onChange={(e) => cambiar(i, { explicacion: e.target.value })} maxLength={500} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`ps-${i}`}>Segundo del video</Label>
                    <Input id={`ps-${i}`} type="number" min={0} value={p.segundoVideo} onChange={(e) => cambiar(i, { segundoVideo: e.target.value })} placeholder="Quiz final" />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => setLista((l) => [...l, vacia()])} disabled={lista.length >= 20}>
                <Plus /> Agregar pregunta
              </Button>
              {lista.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button type="button" variant="outline" size="sm" disabled={guardando} onClick={() => void guardar("alumno")}>
                    <Printer className="size-3.5" /> Guardar e imprimir evaluación
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={guardando} onClick={() => void guardar("clave")}>
                    <KeyRound className="size-3.5" /> Imprimir clave
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={() => void guardar()} disabled={guardando || cargando}>
            {guardando && <Spinner />} Guardar evaluación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
