"use client";

// Propio de Ordo (lane 172, K1): la libreta de calificaciones de un hijo — promedio general, una tarjeta por materia con su
// promedio y sus notas (editar, borrar), alta de notas sueltas e impresión. Solo la ven los padres.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Plus, Printer, ScrollText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ETIQUETA_CALIFICACION, letraDe, tonoDe } from "@/lib/homeschooling/calificaciones";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { Libreta as LibretaDatos } from "@/lib/homeschooling/servidor/calificaciones";
import { toast } from "@/lib/toast";
import { colorCss } from "@/components/homeschooling/cursos/iconos";
import { StatsCard } from "@/components/homeschooling/roost/StatsCard";
import NotaForm, { type NotaEditable } from "./NotaForm";
import { Award, NotebookPen } from "lucide-react";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
const TONO = { bien: "text-success", medio: "text-warning", bajo: "text-destructive" } as const;

export default function Libreta({ libreta, alumnos }: { libreta: LibretaDatos; alumnos: { id: number; nombre: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState<{ abierto: boolean; editando: NotaEditable | null; materiaId: number | null }>({ abierto: false, editando: null, materiaId: null });
  const [borrar, setBorrar] = useState<{ id: number; titulo: string } | null>(null);
  const materias = libreta.materias.map((m) => ({ id: m.materiaId, nombre: m.materia }));

  const confirmarBorrado = async () => {
    if (!borrar) return;
    try {
      await api(`/api/homeschooling/notas/${borrar.id}`, { method: "DELETE" });
      setBorrar(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar");
      setBorrar(null);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <NotebookPen className="size-6" /> Libreta de {libreta.alumno.nombre}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/homeschooling/boletin?alumno=${libreta.alumno.id}`}>
              <ScrollText /> Boletín
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Imprimir
          </Button>
          <Button onClick={() => setForm({ abierto: true, editando: null, materiaId: null })} disabled={materias.length === 0}>
            <Plus /> Agregar nota
          </Button>
        </div>
      </div>
      <h1 className="hidden text-2xl font-bold text-black print:block">Libreta de calificaciones · {libreta.alumno.nombre}</h1>

      {alumnos.length > 1 && (
        <nav aria-label="Hijos" className="flex flex-wrap gap-1.5 print:hidden">
          {alumnos.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/homeschooling/libreta?alumno=${a.id}`}
              aria-current={a.id === libreta.alumno.id ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${a.id === libreta.alumno.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              {a.nombre}
            </Link>
          ))}
        </nav>
      )}

      <section aria-label="Resumen" className="grid grid-cols-2 gap-3">
        <StatsCard title="Promedio general" value={libreta.promedio === null ? "—" : `${libreta.promedio.toLocaleString("es")} (${letraDe(libreta.promedio)})`} icon={Award} color={libreta.promedio === null ? "primary" : tonoDe(libreta.promedio) === "bien" ? "success" : tonoDe(libreta.promedio) === "medio" ? "warning" : "error"} />
        <StatsCard title="Notas registradas" value={libreta.cantidad} icon={NotebookPen} color="primary" />
      </section>

      {libreta.materias.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <NotebookPen />
            </EmptyMedia>
            <EmptyTitle>Todavía no hay materias</EmptyTitle>
            <EmptyDescription>Cuando {libreta.alumno.nombre} tenga un curso asignado, sus materias aparecen acá para ponerle notas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {libreta.materias.map((m) => (
            <section key={m.materiaId} aria-label={m.materia} className="sin-corte overflow-hidden rounded-xl border bg-card">
              <header className="flex items-center gap-3 border-b px-4 py-3" style={{ borderLeft: `4px solid ${colorCss(m.color)}` }}>
                <h2 className="min-w-0 flex-1 truncate font-semibold text-foreground">{m.materia}</h2>
                {m.promedio !== null && m.letra && (
                  <span className={`text-lg font-bold tabular-nums ${TONO[tonoDe(m.promedio)]}`}>
                    {m.promedio.toLocaleString("es")} <span className="text-sm">({m.letra})</span>
                  </span>
                )}
                <Button variant="ghost" size="sm" className="print:hidden" onClick={() => setForm({ abierto: true, editando: null, materiaId: m.materiaId })}>
                  <Plus /> Nota
                </Button>
              </header>
              {m.notas.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Sin notas todavía.</p>
              ) : (
                <ul className="divide-y">
                  {m.notas.map((n) => (
                    <li key={n.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                      <span className={`w-12 shrink-0 text-right text-base font-bold tabular-nums ${TONO[tonoDe(n.puntaje)]}`}>{n.puntaje}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {n.titulo} <span className="font-normal text-muted-foreground">· {ETIQUETA_CALIFICACION[n.tipo]} · {FECHA.format(new Date(`${n.fecha}T00:00:00Z`))}</span>
                        </p>
                        {n.comentario && <p className="text-muted-foreground">{n.comentario}</p>}
                      </div>
                      <div className="flex shrink-0 gap-0.5 print:hidden">
                        <Button variant="ghost" size="icon-sm" aria-label={`Editar «${n.titulo}»`} onClick={() => setForm({ abierto: true, editando: { ...n, materiaId: m.materiaId }, materiaId: null })}>
                          <Edit2 />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Borrar «${n.titulo}»`} onClick={() => setBorrar({ id: n.id, titulo: n.titulo })}>
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <NotaForm
        open={form.abierto}
        alumnoId={libreta.alumno.id}
        materias={materias}
        materiaInicial={form.materiaId}
        editando={form.editando}
        onClose={() => setForm((f) => ({ ...f, abierto: false }))}
        onGuardada={() => {
          setForm((f) => ({ ...f, abierto: false }));
          router.refresh();
        }}
      />

      <Dialog open={!!borrar} onOpenChange={(o) => !o && setBorrar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Borrar la nota?</DialogTitle>
            <DialogDescription>«{borrar?.titulo}» se borra de la libreta. No se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBorrar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarBorrado}>
              Borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
