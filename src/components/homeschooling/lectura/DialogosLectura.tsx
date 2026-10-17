"use client";

// Propio de Ordo (lane 175, L1): los tres diálogos de la lista de lectura — agregar/editar un libro, registrar lectura de hoy y
// terminar el libro (valoración y narración).
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/homeschooling/roost/StarRating";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { LibroVista } from "@/lib/homeschooling/servidor/lectura";
import { toast } from "@/lib/toast";

type Comun = { onClose: () => void; onGuardado: () => void };

export function LibroForm({ open, alumnoId, editando, onClose, onGuardado }: Comun & { open: boolean; alumnoId: number; editando: LibroVista | null }) {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [paginas, setPaginas] = useState("");
  const [empezar, setEmpezar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitulo(editando?.titulo ?? "");
    setAutor(editando?.autor ?? "");
    setPaginas(editando?.paginasTotal ? String(editando.paginasTotal) : "");
    setEmpezar(false);
  }, [open, editando]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setGuardando(true);
    try {
      const comunes = { titulo: titulo.trim(), autor: autor.trim() || null, paginasTotal: paginas.trim() ? Number(paginas) : null };
      if (editando) await api(`/api/homeschooling/lectura/${editando.id}`, { method: "PATCH", body: comunes });
      else await api("/api/homeschooling/lectura", { method: "POST", body: { ...comunes, alumnoId, estado: empezar ? "leyendo" : "por_leer" } });
      toast.success(editando ? "Libro actualizado" : "Libro agregado");
      onGuardado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el libro");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar libro" : "Agregar un libro"}</DialogTitle>
          <DialogDescription>Los libros son de papel: acá solo se lleva la cuenta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lib-titulo">Título</Label>
            <Input id="lib-titulo" autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <div className="space-y-1.5">
              <Label htmlFor="lib-autor">Autor (opcional)</Label>
              <Input id="lib-autor" value={autor} onChange={(e) => setAutor(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lib-paginas">Páginas</Label>
              <Input id="lib-paginas" type="number" inputMode="numeric" min={1} max={5000} value={paginas} onChange={(e) => setPaginas(e.target.value)} />
            </div>
          </div>
          {!editando && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={empezar} onChange={(e) => setEmpezar(e.target.checked)} className="size-4 accent-primary" />
              Ya lo está leyendo
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || !titulo.trim()}>
              {guardando && <Spinner />} {editando ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RegistrarLectura({ libro, onClose, onGuardado }: Comun & { libro: LibroVista | null }) {
  const [pagina, setPagina] = useState("");
  const [minutos, setMinutos] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setPagina(libro ? String(libro.paginaActual) : "");
    setMinutos("");
  }, [libro]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libro) return;
    setGuardando(true);
    try {
      const r = await api<LibroVista>(`/api/homeschooling/lectura/${libro.id}/registrar`, { method: "POST", body: { hastaPagina: Number(pagina), minutos: minutos.trim() ? Number(minutos) : null } });
      toast.success(r.estado === "leido" ? "¡Terminó el libro!" : "Lectura registrada");
      onGuardado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={!!libro} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar lectura</DialogTitle>
          <DialogDescription>{libro?.titulo}</DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-pagina">Llegué a la página</Label>
              <Input id="reg-pagina" type="number" inputMode="numeric" min={0} max={5000} autoFocus value={pagina} onChange={(e) => setPagina(e.target.value)} required />
              {libro?.paginasTotal ? <p className="text-xs text-muted-foreground">de {libro.paginasTotal}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-min">Minutos (opcional)</Label>
              <Input id="reg-min" type="number" inputMode="numeric" min={0} max={600} value={minutos} onChange={(e) => setMinutos(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || pagina === ""}>
              {guardando && <Spinner />} Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TerminarLibro({ libro, onClose, onGuardado }: Comun & { libro: LibroVista | null }) {
  const [estrellas, setEstrellas] = useState(0);
  const [narracion, setNarracion] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setEstrellas(libro?.estrellas ?? 0);
    setNarracion(libro?.narracion ?? "");
  }, [libro]);

  const guardar = async () => {
    if (!libro) return;
    setGuardando(true);
    try {
      await api(`/api/homeschooling/lectura/${libro.id}/terminar`, { method: "POST", body: { estrellas: estrellas || null, narracion: narracion.trim() || null } });
      toast.success("Libro terminado");
      onGuardado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={!!libro} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¡Terminó «{libro?.titulo}»!</DialogTitle>
          <DialogDescription>Que cuente con sus palabras de qué trató; anotalo tal cual lo dice. Es la mejor prueba de que lo leyó.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>¿Le gustó?</Label>
            <StarRating rating={estrellas} onChange={setEstrellas} size="lg" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ter-narracion">Narración (opcional)</Label>
            <Textarea id="ter-narracion" rows={6} maxLength={3000} value={narracion} onChange={(e) => setNarracion(e.target.value)} placeholder="Era la historia de…" />
            <p className="text-right text-xs text-muted-foreground">{narracion.length}/3000</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando}>
            {guardando && <Spinner />} Terminar libro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
