"use client";

// Portado de vendor/roost/src/components/groups/learn/ManageModuleModal.tsx (msrbuilds/roost@492af47).
// Cambios: Dialog de ui/, subirImagen en vez de uploadImage (S3), campos de pacing (tipo, unidad, total, minutos,
// enlace, navegación libre), ids numéricos, textos en español.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createModule, updateModule } from "@/lib/homeschooling/roost/services/module";
import type { Module, TipoRecurso, UnidadContenido } from "@/lib/homeschooling/roost/tipos";
import { toast } from "@/lib/toast";
import PortadaCampo from "./PortadaCampo";

export const TIPOS: { id: TipoRecurso; etiqueta: string; unidad: UnidadContenido }[] = [
  { id: "libro", etiqueta: "Libro (páginas)", unidad: "pagina" },
  { id: "curso_videos", etiqueta: "Curso de videos", unidad: "leccion" },
  { id: "enlaces", etiqueta: "Lista de enlaces", unidad: "leccion" },
  { id: "pdf", etiqueta: "PDF o guía", unidad: "pagina" },
  { id: "libre", etiqueta: "Otro (tareas o capítulos)", unidad: "unidad" },
];
const UNIDADES: Record<UnidadContenido, string> = { pagina: "Páginas", capitulo: "Capítulos", leccion: "Lecciones", unidad: "Unidades" };

export default function CursoForm({
  open,
  materiaId,
  onClose,
  onSuccess,
  editing,
}: {
  open: boolean;
  materiaId: number;
  onClose: () => void;
  onSuccess: (m: Module) => void;
  editing?: Module | null;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [portada, setPortada] = useState("");
  const [tipo, setTipo] = useState<TipoRecurso>("libro");
  const [unidad, setUnidad] = useState<UnidadContenido>("pagina");
  const [total, setTotal] = useState("");
  const [minutos, setMinutos] = useState("20");
  const [url, setUrl] = useState("");
  const [libre, setLibre] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const conLecciones = tipo === "curso_videos" || tipo === "enlaces";

  useEffect(() => {
    if (!open) return;
    setTitulo(editing?.title ?? "");
    setDescripcion(editing?.description ?? "");
    setPortada(editing?.thumbnail_url ?? "");
    setTipo(editing?.tipo ?? "libro");
    setUnidad(editing?.unidad_tipo ?? "pagina");
    setTotal(editing ? String(editing.total_unidades) : "");
    setMinutos(String(editing?.minutos_por_unidad ?? 20));
    setUrl(editing?.url ?? "");
    setLibre(editing?.navegacion_libre ?? false);
  }, [open, editing]);

  const elegirTipo = (id: TipoRecurso) => {
    setTipo(id);
    setUnidad(TIPOS.find((t) => t.id === id)!.unidad);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    const totalNum = Number(total);
    if (!conLecciones && !(totalNum >= 1)) {
      toast.error("Indicá cuántas unidades tiene");
      return;
    }
    setGuardando(true);
    try {
      const comunes = {
        title: titulo.trim(),
        description: descripcion.trim() || null,
        thumbnail_url: portada || null,
        unidad_tipo: unidad,
        url: url.trim() || null,
        minutos_por_unidad: Number(minutos) || 20,
        navegacion_libre: libre,
        ...(conLecciones ? {} : { total_unidades: totalNum }),
      };
      onSuccess(editing ? await updateModule(editing.id, comunes) : await createModule({ ...comunes, materia_id: materiaId, tipo, libro_id: null, umbral_aprobacion: 70 }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el curso");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar curso" : "Nuevo curso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          <PortadaCampo url={portada} onChange={setPortada} />
          <div className="space-y-1.5">
            <Label htmlFor="cur-titulo">Título</Label>
            <Input id="cur-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Historia de Uruguay" maxLength={150} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cur-desc">Descripción</Label>
            <Textarea id="cur-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cur-tipo">Tipo</Label>
              <NativeSelect id="cur-tipo" className="w-full" value={tipo} onChange={(e) => elegirTipo(e.target.value as TipoRecurso)} disabled={!!editing}>
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.etiqueta}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cur-unidad">Se avanza por</Label>
              <NativeSelect id="cur-unidad" className="w-full" value={unidad} onChange={(e) => setUnidad(e.target.value as UnidadContenido)}>
                {Object.entries(UNIDADES).map(([id, etiqueta]) => (
                  <option key={id} value={id}>
                    {etiqueta}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cur-total">Total de unidades</Label>
              <Input
                id="cur-total"
                type="number"
                min={1}
                value={conLecciones ? String(editing?.total_unidades ?? 0) : total}
                onChange={(e) => setTotal(e.target.value)}
                disabled={conLecciones}
                placeholder="300"
              />
              {conLecciones && <p className="text-xs text-muted-foreground">Es la cantidad de lecciones que cargues.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cur-min">Minutos por unidad</Label>
              <Input id="cur-min" type="number" min={1} max={600} value={minutos} onChange={(e) => setMinutos(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cur-url">Enlace (opcional)</Label>
            <Input id="cur-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span>
              <span className="block font-medium text-foreground">Navegación libre</span>
              <span className="text-xs text-muted-foreground">Permite adelantar al día siguiente si el anterior está hecho.</span>
            </span>
            <Switch checked={libre} onCheckedChange={setLibre} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || !titulo.trim()}>
              {guardando && <Spinner />} {editing ? "Guardar cambios" : "Crear curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
