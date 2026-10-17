"use client";

// Propio de Ordo (lane 177, L3): la biblioteca de cursos católicos de la casa. Se elige uno y se agrega a la materia con un clic,
// con todas sus lecciones y material. Después se asigna a un hijo como cualquier curso.
import { useEffect, useState } from "react";
import { Cross, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";

type Entrada = { clave: string; titulo: string; descripcion: string; edad: string; lecciones: number };

export default function BibliotecaCatolica({ materiaId, onImportado }: { materiaId: number; onImportado: (cursoId: number) => void }) {
  const [abierta, setAbierta] = useState(false);
  const [lista, setLista] = useState<Entrada[] | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  useEffect(() => {
    if (!abierta || lista) return;
    let vigente = true;
    api<Entrada[]>("/api/homeschooling/biblioteca")
      .then((r) => vigente && setLista(r))
      .catch((e) => {
        if (!vigente) return;
        setLista([]);
        toast.error(e instanceof Error ? e.message : "No se pudo cargar la biblioteca");
      });
    return () => {
      vigente = false;
    };
  }, [abierta, lista]);

  const agregar = async (e: Entrada) => {
    setOcupado(e.clave);
    try {
      const r = await api<{ id: number }>(`/api/homeschooling/materias/${materiaId}/biblioteca`, { method: "POST", body: { clave: e.clave } });
      toast.success(`«${e.titulo}» agregado a la materia`);
      setAbierta(false);
      onImportado(r.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar el curso");
    } finally {
      setOcupado(null);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setAbierta(true)}>
        <Library /> Biblioteca católica
      </Button>
      <Dialog open={abierta} onOpenChange={(o) => !ocupado && setAbierta(o)}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cross className="size-5" /> Biblioteca católica
            </DialogTitle>
            <DialogDescription>Cursos listos para agregar a esta materia: lecciones con lectura, tarea para el cuaderno y preguntas para conversar en familia.</DialogDescription>
          </DialogHeader>
          {lista === null ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <ul className="space-y-2">
              {lista.map((e) => (
                <li key={e.clave} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{e.titulo}</p>
                    <p className="text-sm text-muted-foreground">{e.descripcion}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {e.lecciones} lecciones · {e.edad}
                    </p>
                  </div>
                  <Button size="sm" disabled={ocupado !== null} onClick={() => agregar(e)}>
                    {ocupado === e.clave && <Spinner />} Agregar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
