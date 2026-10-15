"use client";

// Propio de Ordo (lane 170, M3): carga masiva de lecciones. El padre pega una lista (un enlace por línea, o «Título | enlace»),
// la app detecta cada enlace y trae los títulos; se revisa y se crean todas juntas. El texto queda como borrador si se cierra.
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { LeccionPrevia } from "@/lib/homeschooling/servidor/lote";
import { useBorrador } from "@/lib/homeschooling/useBorrador";
import { toast } from "@/lib/toast";

export default function AgregarVarias({ open, recursoId, onClose, onCreadas }: { open: boolean; recursoId: number; onClose: () => void; onCreadas: (cantidad: number) => void }) {
  const [texto, setTexto, borrarBorrador] = useBorrador(`varias-${recursoId}`);
  const [previa, setPrevia] = useState<LeccionPrevia[] | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cerrar = () => {
    if (ocupado) return;
    setPrevia(null);
    onClose();
  };

  const revisar = async () => {
    setOcupado(true);
    try {
      const r = await api<LeccionPrevia[]>("/api/homeschooling/lecciones/lote", { method: "POST", body: { texto } });
      if (r.length === 0) toast.info("No encontré ninguna línea con contenido");
      else setPrevia(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo leer la lista");
    } finally {
      setOcupado(false);
    }
  };

  const crear = async () => {
    if (!previa?.length) return;
    setOcupado(true);
    try {
      await api("/api/homeschooling/lecciones/lote", { method: "PUT", body: { recursoId, lecciones: previa.map((l) => ({ titulo: l.titulo, url: l.url })) } });
      toast.success(previa.length === 1 ? "Lección creada" : `${previa.length} lecciones creadas`);
      const n = previa.length;
      borrarBorrador();
      setPrevia(null);
      onCreadas(n);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron crear las lecciones");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar varias lecciones</DialogTitle>
          <DialogDescription>Pegá una lista: un enlace por línea (YouTube, Vimeo, Drive, web) o «Título | enlace». Los títulos se completan solos.</DialogDescription>
        </DialogHeader>

        {previa === null ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="var-texto">Tu lista</Label>
              <Textarea
                id="var-texto"
                autoFocus
                rows={10}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={"https://youtu.be/…\nEl Credo | https://youtu.be/…\n[Padre Nuestro](https://youtu.be/…)\nRepasar los mandamientos"}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Hasta 100 líneas. Una línea sin enlace es una lección de texto.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={cerrar}>
                Cancelar
              </Button>
              <Button onClick={revisar} disabled={ocupado || !texto.trim()}>
                {ocupado && <Spinner />} Revisar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <ol className="max-h-[50svh] space-y-2 overflow-y-auto pr-1">
              {previa.map((l, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg border bg-card p-2">
                  <span className="w-6 shrink-0 text-center text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Input
                      aria-label={`Título de la lección ${i + 1}`}
                      value={l.titulo}
                      maxLength={150}
                      onChange={(e) => setPrevia((p) => p && p.map((x, k) => (k === i ? { ...x, titulo: e.target.value } : x)))}
                    />
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {l.etiqueta}
                      {l.url ? ` · ${l.url}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={`Quitar la lección ${i + 1}`} onClick={() => setPrevia((p) => p && p.filter((_, k) => k !== i))}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ol>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPrevia(null)} disabled={ocupado}>
                Volver a la lista
              </Button>
              <Button onClick={crear} disabled={ocupado || previa.length === 0 || previa.some((l) => !l.titulo.trim())}>
                {ocupado && <Spinner />} Crear {previa.length === 1 ? "la lección" : `${previa.length} lecciones`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
