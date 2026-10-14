"use client";

// Propio de Ordo: pantalla del padre para configurar, por alumno, el modo relajado, Primero/Después y las historias sociales.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/homeschooling/roost/services/http";
import { PLANTILLAS_HISTORIA } from "@/lib/homeschooling/neuro";
import type { HistoriaVista, Preferencia } from "@/lib/homeschooling/servidor/neuro";
import { toast } from "@/lib/toast";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";
import EditorHistoria, { type BorradorHistoria } from "./EditorHistoria";
import VisorHistoria from "./VisorHistoria";

export default function PanelNeuro({ alumnos, preferencias, historias }: { alumnos: AlumnoLite[]; preferencias: Record<number, Preferencia>; historias: HistoriaVista[] }) {
  const router = useRouter();
  const [editor, setEditor] = useState<{ open: boolean; inicial: BorradorHistoria | null }>({ open: false, inicial: null });
  const [vista, setVista] = useState<HistoriaVista | null>(null);
  const [mostrar, setMostrar] = useState<HistoriaVista | null>(null);
  const [elegidos, setElegidos] = useState<number[]>([]);

  const guardarPref = async (alumnoId: number, cambios: Partial<Preferencia>) => {
    try {
      await api("/api/homeschooling/preferencias", { method: "PUT", body: { alumnoId, ...cambios } });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const confirmarMostrar = async () => {
    if (!mostrar) return;
    try {
      await api(`/api/homeschooling/historias/${mostrar.id}/mostrar`, { method: "POST", body: { alumnoIds: elegidos } });
      toast.success("La historia le aparece hoy");
      setMostrar(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo mostrar");
    }
  };

  const borrar = async (h: HistoriaVista) => {
    try {
      await api(`/api/homeschooling/historias/${h.id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-foreground">Apoyos para cada alumno</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Vista de «Hoy aprendo»</h2>
        {alumnos.map((a) => {
          const p = preferencias[a.id];
          return (
            <div key={a.id} className="space-y-3 rounded-xl border bg-card p-4">
              <p className="font-semibold text-foreground">{a.nombre}</p>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="block font-medium text-foreground">Modo relajado</span>
                  <span className="text-xs text-muted-foreground">Colores serenos, sin confeti ni movimiento decorativo.</span>
                </span>
                <Switch checked={p.modoRelajado} onCheckedChange={(v) => guardarPref(a.id, { modoRelajado: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="block font-medium text-foreground">Primero / Después</span>
                  <span className="text-xs text-muted-foreground">Una sola tarea a la vez y lo que viene después.</span>
                </span>
                <Switch checked={p.primeroDespues} onCheckedChange={(v) => guardarPref(a.id, { primeroDespues: v })} />
              </label>
              {p.primeroDespues && (
                <div className="space-y-1.5">
                  <Label htmlFor={`rd-${a.id}`}>Después… (la recompensa)</Label>
                  <Input
                    id={`rd-${a.id}`}
                    defaultValue={p.recompensaDespues ?? ""}
                    placeholder="15 min de Lego"
                    maxLength={120}
                    onBlur={(e) => e.target.value.trim() !== (p.recompensaDespues ?? "") && guardarPref(a.id, { recompensaDespues: e.target.value })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Historias sociales</h2>
          <div className="flex flex-wrap gap-2">
            {PLANTILLAS_HISTORIA.map((t) => (
              <Button key={t.titulo} size="sm" variant="outline" onClick={() => setEditor({ open: true, inicial: { titulo: t.titulo, pasos: t.pasos } })}>
                <Plus /> {t.titulo}
              </Button>
            ))}
            <Button size="sm" onClick={() => setEditor({ open: true, inicial: null })}>
              <Plus /> Nueva
            </Button>
          </div>
        </div>
        {historias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay historias. Empezá con una plantilla.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {historias.map((h) => (
              <li key={h.id} className="flex items-center gap-2 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {h.titulo} <span className="font-normal text-muted-foreground">· {h.pasos.length} pasos</span>
                </span>
                <Button size="sm" variant="outline" onClick={() => (setMostrar(h), setElegidos(alumnos.map((a) => a.id)))}>
                  Mostrar hoy
                </Button>
                <Button size="icon" variant="ghost" aria-label="Ver" onClick={() => setVista(h)}>
                  <Eye />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEditor({ open: true, inicial: { id: h.id, titulo: h.titulo, pasos: h.pasos } })}>
                  <Pencil />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Borrar" className="text-destructive" onClick={() => borrar(h)}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditorHistoria
        open={editor.open}
        inicial={editor.inicial}
        onClose={() => setEditor({ open: false, inicial: null })}
        onGuardada={() => {
          setEditor({ open: false, inicial: null });
          router.refresh();
        }}
      />
      <VisorHistoria key={vista?.id ?? 0} historia={vista} onClose={() => setVista(null)} marcarVista={false} />

      <Dialog open={!!mostrar} onOpenChange={(o) => !o && setMostrar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mostrar «{mostrar?.titulo}» hoy</DialogTitle>
            <DialogDescription>Le aparece arriba de «Hoy aprendo» hasta que la vea.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {alumnos.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={elegidos.includes(a.id)} onCheckedChange={() => setElegidos((e) => (e.includes(a.id) ? e.filter((x) => x !== a.id) : [...e, a.id]))} /> {a.nombre}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrar(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarMostrar} disabled={elegidos.length === 0}>
              Mostrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
