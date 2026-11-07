"use client";
// Portado de vendor/homebranch-web/src/app/routes/dashboard/book-shelf.tsx (lane 270, fase 2), en una lista simple
// para los padres: agregar libros, editar título/autor/sinopsis/estantes, borrar libros y manejar los estantes.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EstanteVista, LibroDetalle, LibroResumen } from "@/lib/biblioteca/servidor";
import { SubirLibro } from "./SubirLibro";

type Edicion = { id: number; titulo: string; autor: string; sinopsis: string; portadaUrl: string | null; estanteIds: number[] };

async function pedir(url: string, metodo: string, cuerpo?: unknown) {
  const res = await fetch(url, {
    method: metodo,
    headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || "No se pudo guardar");
  return datos;
}

export function GestionBiblioteca({ libros, estantes }: { libros: LibroResumen[]; estantes: EstanteVista[] }) {
  const router = useRouter();
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [nuevoEstante, setNuevoEstante] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  async function hacer(f: () => Promise<unknown>) {
    setOcupado(true);
    setError("");
    try {
      await f();
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function abrirEdicion(id: number) {
    await hacer(async () => {
      const { libro } = (await pedir(`/api/biblioteca/libros/${id}`, "GET")) as { libro: LibroDetalle };
      setEdicion({
        id,
        titulo: libro.titulo,
        autor: libro.autor ?? "",
        sinopsis: libro.sinopsis ?? "",
        portadaUrl: libro.portadaUrl,
        estanteIds: libro.estanteIds,
      });
    });
  }

  async function guardarEdicion() {
    if (!edicion) return;
    const e = edicion;
    const listo = await hacer(() =>
      pedir(`/api/biblioteca/libros/${e.id}`, "PATCH", {
        titulo: e.titulo,
        autor: e.autor,
        sinopsis: e.sinopsis,
        portadaUrl: e.portadaUrl,
        estanteIds: e.estanteIds,
      }),
    );
    if (listo) setEdicion(null);
  }

  function borrarLibro(l: LibroResumen) {
    if (!window.confirm(`¿Borrar «${l.titulo}»? Se pierde el progreso de lectura de todos.`)) return;
    void hacer(() => pedir(`/api/biblioteca/libros/${l.id}`, "DELETE"));
  }

  async function crearEstante() {
    const nombre = nuevoEstante.trim();
    if (!nombre) return;
    if (await hacer(() => pedir("/api/biblioteca/estantes", "POST", { nombre }))) setNuevoEstante("");
  }

  function renombrarEstante(e: EstanteVista) {
    const nombre = window.prompt("Nuevo nombre del estante", e.nombre)?.trim();
    if (nombre && nombre !== e.nombre) void hacer(() => pedir("/api/biblioteca/estantes", "PATCH", { id: e.id, nombre }));
  }

  function borrarEstante(e: EstanteVista) {
    if (!window.confirm(`¿Borrar el estante «${e.nombre}»? Los libros quedan en la biblioteca.`)) return;
    void hacer(() => pedir(`/api/biblioteca/estantes?id=${e.id}`, "DELETE"));
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Button asChild variant="ghost" className="min-h-11 self-start">
        <Link href="/dashboard/biblioteca">
          <ArrowLeft /> Biblioteca
        </Link>
      </Button>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gestionar la biblioteca</h1>
          <p className="text-muted-foreground">Agregá libros, ordenalos en estantes o sacalos.</p>
        </div>
        <SubirLibro />
      </header>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}
        </p>
      )}

      <section aria-labelledby="titulo-estantes" className="flex flex-col gap-3">
        <h2 id="titulo-estantes" className="text-lg font-semibold">
          Estantes
        </h2>
        <ul className="flex flex-col divide-y rounded-lg border">
          {estantes.length === 0 && <li className="p-3 text-sm text-muted-foreground">Todavía no hay estantes.</li>}
          {estantes.map((e) => (
            <li key={e.id} className="flex items-center gap-2 p-2 pl-3">
              <span className="min-w-0 flex-1 truncate">{e.nombre}</span>
              <Button variant="ghost" size="icon" disabled={ocupado} aria-label={`Renombrar ${e.nombre}`} onClick={() => renombrarEstante(e)}>
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon" disabled={ocupado} aria-label={`Borrar ${e.nombre}`} onClick={() => borrarEstante(e)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(ev) => {
            ev.preventDefault();
            void crearEstante();
          }}
        >
          <Input value={nuevoEstante} onChange={(ev) => setNuevoEstante(ev.target.value)} placeholder="Nombre del estante nuevo" aria-label="Nombre del estante nuevo" className="min-h-11" maxLength={60} />
          <Button type="submit" variant="outline" className="min-h-11" disabled={ocupado || !nuevoEstante.trim()}>
            <Plus /> Crear
          </Button>
        </form>
      </section>

      <section aria-labelledby="titulo-libros" className="flex flex-col gap-3">
        <h2 id="titulo-libros" className="text-lg font-semibold">
          Libros ({libros.length})
        </h2>
        <ul className="flex flex-col divide-y rounded-lg border">
          {libros.length === 0 && <li className="p-3 text-sm text-muted-foreground">Todavía no hay libros. Usá «Agregar libros».</li>}
          {libros.map((l) => (
            <li key={l.id} className="flex items-center gap-2 p-2 pl-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.titulo}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {[l.autor, l.estanteIds.map((id) => estantes.find((e) => e.id === id)?.nombre).filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "Sin autor ni estante"}
                </p>
              </div>
              <Button variant="ghost" size="icon" disabled={ocupado} aria-label={`Editar ${l.titulo}`} onClick={() => void abrirEdicion(l.id)}>
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon" disabled={ocupado} aria-label={`Borrar ${l.titulo}`} onClick={() => borrarLibro(l)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <Dialog open={edicion !== null} onOpenChange={(o) => !o && setEdicion(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar libro</DialogTitle>
          </DialogHeader>
          {edicion && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ed-titulo">Título</Label>
                <Input id="ed-titulo" value={edicion.titulo} onChange={(ev) => setEdicion({ ...edicion, titulo: ev.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ed-autor">Autor</Label>
                <Input id="ed-autor" value={edicion.autor} onChange={(ev) => setEdicion({ ...edicion, autor: ev.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ed-sinopsis">Sinopsis</Label>
                <Textarea id="ed-sinopsis" rows={4} value={edicion.sinopsis} onChange={(ev) => setEdicion({ ...edicion, sinopsis: ev.target.value })} />
              </div>
              {estantes.length > 0 && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-medium">Estantes</legend>
                  {estantes.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={edicion.estanteIds.includes(e.id)}
                        onCheckedChange={(c) =>
                          setEdicion({
                            ...edicion,
                            estanteIds: c === true ? [...edicion.estanteIds, e.id] : edicion.estanteIds.filter((x) => x !== e.id),
                          })
                        }
                      />
                      {e.nombre}
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" className="min-h-11" onClick={() => setEdicion(null)}>
              Cancelar
            </Button>
            <Button className="min-h-11" disabled={ocupado || !edicion?.titulo.trim()} onClick={() => void guardarEdicion()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
