"use client";

// Propio de Ordo (lane 175, L1): la lista de lectura de un hijo — libros leyendo, por leer y leídos, con avance, registro del
// día, valoración y narración. Lectura real: nada de pantallas para leer, solo para llevar la cuenta.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookMarked, BookOpen, CheckCircle2, Edit2, Flame, Library, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/homeschooling/roost/StatsCard";
import { StarRating } from "@/components/homeschooling/roost/StarRating";
import { ETIQUETA_LECTURA, type EstadoLectura } from "@/lib/homeschooling/lectura";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { LibroVista, ListaLectura as Datos } from "@/lib/homeschooling/servidor/lectura";
import { toast } from "@/lib/toast";
import CampoBusqueda from "@/components/homeschooling/nav/CampoBusqueda";
import { filtrar } from "@/lib/homeschooling/buscarTexto";
import { LibroForm, RegistrarLectura, TerminarLibro } from "./DialogosLectura";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const f = (c: string) => FECHA.format(new Date(`${c}T00:00:00Z`));

export default function ListaLectura({ datos, alumnos, esPadre }: { datos: Datos; alumnos: { id: number; nombre: string }[]; esPadre: boolean }) {
  const router = useRouter();
  const [pestana, setPestana] = useState<EstadoLectura>(datos.libros.some((l) => l.estado === "leyendo") ? "leyendo" : "por_leer");
  const [formulario, setFormulario] = useState<{ abierto: boolean; editando: LibroVista | null }>({ abierto: false, editando: null });
  const [registrando, setRegistrando] = useState<LibroVista | null>(null);
  const [terminando, setTerminando] = useState<LibroVista | null>(null);

  const refrescar = () => router.refresh();
  const [q, setQ] = useState("");
  const libros = filtrar(datos.libros.filter((l) => l.estado === pestana), q, (l) => [l.titulo, l.autor, l.narracion]);
  const cuenta = (e: EstadoLectura) => datos.libros.filter((l) => l.estado === e).length;

  const empezar = async (l: LibroVista) => {
    try {
      await api(`/api/homeschooling/lectura/${l.id}`, { method: "PATCH", body: { estado: "leyendo" } });
      setPestana("leyendo");
      refrescar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo empezar");
    }
  };

  const borrar = async (l: LibroVista) => {
    if (!window.confirm(`¿Sacar «${l.titulo}» de la lista?`)) return;
    try {
      await api(`/api/homeschooling/lectura/${l.id}`, { method: "DELETE" });
      refrescar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar");
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Library className="size-6" /> {esPadre ? `Lectura de ${datos.alumno.nombre}` : "Mi lectura"}
        </h1>
        <Button onClick={() => setFormulario({ abierto: true, editando: null })}>
          <Plus /> Agregar libro
        </Button>
      </div>

      {esPadre && alumnos.length > 1 && (
        <nav aria-label="Hijos" className="flex flex-wrap gap-1.5">
          {alumnos.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/homeschooling/lectura?alumno=${a.id}`}
              aria-current={a.id === datos.alumno.id ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm font-medium ${a.id === datos.alumno.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              {a.nombre}
            </Link>
          ))}
        </nav>
      )}

      <section aria-label="Resumen" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatsCard title="Leídos este año" value={datos.resumen.librosLeidosAnio} icon={BookMarked} color="success" />
        <StatsCard title="Páginas esta semana" value={datos.resumen.paginasSemana} icon={BookOpen} color="primary" />
        <StatsCard title="Racha de lectura" value={datos.resumen.racha === 0 ? "—" : `${datos.resumen.racha} ${datos.resumen.racha === 1 ? "día" : "días"}`} icon={Flame} color={datos.resumen.racha > 0 ? "warning" : "primary"} />
      </section>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Estado de lectura">
        {(["leyendo", "por_leer", "leido"] as const).map((e) => (
          <button
            key={e}
            type="button"
            aria-pressed={pestana === e}
            onClick={() => setPestana(e)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${pestana === e ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"}`}
          >
            {ETIQUETA_LECTURA[e]} <span className={pestana === e ? "text-primary-foreground/80 tabular-nums" : "text-muted-foreground tabular-nums"}>{cuenta(e)}</span>
          </button>
        ))}
      </div>

      {datos.libros.length > 3 && <CampoBusqueda valor={q} onChange={setQ} placeholder="Buscar un libro…" cantidad={libros.length} />}

      {libros.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Library />
            </EmptyMedia>
            <EmptyTitle>{pestana === "leyendo" ? "No está leyendo nada ahora" : pestana === "por_leer" ? "La lista de por leer está vacía" : "Todavía no terminó ningún libro"}</EmptyTitle>
            <EmptyDescription>{pestana === "leido" ? "Cuando termine uno, queda guardado acá con su valoración y su narración." : "Agregá un libro de la biblioteca de casa."}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="space-y-3">
          {libros.map((l) => (
            <li key={l.id} className="flex gap-3 rounded-xl border bg-card p-3">
              <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                {l.portadaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.portadaUrl} alt="" className="size-full object-cover" />
                ) : (
                  <BookOpen className="size-6" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-foreground">{l.titulo}</h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.autor ?? "Autor sin cargar"}
                      {l.asignado && " · lo eligieron mamá o papá"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button variant="ghost" size="icon-sm" aria-label={`Editar «${l.titulo}»`} onClick={() => setFormulario({ abierto: true, editando: l })}>
                      <Edit2 />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Sacar «${l.titulo}»`} onClick={() => borrar(l)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                {l.estado === "leyendo" && (
                  <>
                    {l.porcentaje !== null ? (
                      <div className="space-y-1">
                        <Progress value={l.porcentaje} />
                        <p className="text-xs text-muted-foreground">
                          Página {l.paginaActual} de {l.paginasTotal} · {l.porcentaje}%
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Va por la página {l.paginaActual}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setRegistrando(l)}>
                        <BookOpen /> Registrar lectura
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setTerminando(l)}>
                        <CheckCircle2 /> Lo terminé
                      </Button>
                    </div>
                  </>
                )}
                {l.estado === "por_leer" && (
                  <Button size="sm" variant="outline" onClick={() => empezar(l)}>
                    <Play /> Empezar a leerlo
                  </Button>
                )}
                {l.estado === "leido" && (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {l.estrellas ? <StarRating rating={l.estrellas} readonly size="sm" /> : null}
                      {l.terminadoEn && <span>Terminado el {f(l.terminadoEn)}</span>}
                      {l.paginasTotal ? <span>· {l.paginasTotal} páginas</span> : null}
                    </div>
                    {l.narracion ? <p className="line-clamp-3 border-l-2 border-primary/40 pl-2 text-sm text-foreground italic">{l.narracion}</p> : null}
                    <Button size="sm" variant="ghost" onClick={() => setTerminando(l)}>
                      {l.narracion ? "Editar narración" : "Agregar narración"}
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <LibroForm open={formulario.abierto} alumnoId={datos.alumno.id} editando={formulario.editando} onClose={() => setFormulario((x) => ({ ...x, abierto: false }))} onGuardado={() => { setFormulario((x) => ({ ...x, abierto: false })); refrescar(); }} />
      <RegistrarLectura libro={registrando} onClose={() => setRegistrando(null)} onGuardado={() => { setRegistrando(null); refrescar(); }} />
      <TerminarLibro libro={terminando} onClose={() => setTerminando(null)} onGuardado={() => { setTerminando(null); refrescar(); }} />
    </div>
  );
}
