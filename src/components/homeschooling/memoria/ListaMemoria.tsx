"use client";

// Propio de Ordo (lane 176, L2): la memoria de un hijo — lo que le toca recitar hoy, lo que está aprendiendo y lo que ya sabe.
// El padre agrega, quita, imprime la hoja para copiar a mano y arranca el recitado; el hijo ve sus textos y su avance.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, CheckCircle2, ChevronDown, Mic, PenLine, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatsCard } from "@/components/homeschooling/roost/StatsCard";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { ListaMemoria as Datos } from "@/lib/homeschooling/servidor/memoria";
import { toast } from "@/lib/toast";
import CampoBusqueda from "@/components/homeschooling/nav/CampoBusqueda";
import { filtrar } from "@/lib/homeschooling/buscarTexto";
import AgregarMemoria from "./AgregarMemoria";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
const f = (c: string) => FECHA.format(new Date(`${c}T00:00:00Z`));

export default function ListaMemoria({ datos, alumnos, esPadre }: { datos: Datos; alumnos: { id: number; nombre: string }[]; esPadre: boolean }) {
  const router = useRouter();
  const [agregando, setAgregando] = useState(false);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const visibles = filtrar(datos.items, q, (m) => [m.titulo, m.texto]);
  const base = "/dashboard/homeschooling";

  const quitar = async (id: number, titulo: string) => {
    if (!window.confirm(`¿Sacar «${titulo}» de la memoria?`)) return;
    try {
      await api(`/api/homeschooling/memoria/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo quitar");
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Brain className="size-6" /> {esPadre ? `Memoria de ${datos.alumno.nombre}` : "Mi memoria"}
        </h1>
        {esPadre && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAgregando(true)}>
              <Plus /> Agregar
            </Button>
            <Button asChild disabled={datos.tocanHoy === 0}>
              <Link href={`${base}/memoria/recitar?alumno=${datos.alumno.id}`} aria-disabled={datos.tocanHoy === 0}>
                <Mic /> Recitar hoy{datos.tocanHoy > 0 ? ` (${datos.tocanHoy})` : ""}
              </Link>
            </Button>
          </div>
        )}
      </div>

      {esPadre && alumnos.length > 1 && (
        <nav aria-label="Hijos" className="flex flex-wrap gap-1.5">
          {alumnos.map((a) => (
            <Link key={a.id} href={`${base}/memoria?alumno=${a.id}`} aria-current={a.id === datos.alumno.id ? "page" : undefined} className={`rounded-full border px-3 py-1 text-sm font-medium ${a.id === datos.alumno.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
              {a.nombre}
            </Link>
          ))}
        </nav>
      )}

      <section aria-label="Resumen" className="grid grid-cols-3 gap-3">
        <StatsCard title="Toca recitar hoy" value={datos.tocanHoy} icon={Mic} color={datos.tocanHoy > 0 ? "warning" : "success"} />
        <StatsCard title="Aprendiendo" value={datos.items.length - datos.dominadas} icon={Brain} color="primary" />
        <StatsCard title="Ya las sabe" value={datos.dominadas} icon={CheckCircle2} color="success" />
      </section>

      {datos.items.length > 5 && <CampoBusqueda valor={q} onChange={setQ} placeholder="Buscar una oración o una lista…" cantidad={visibles.length} />}

      {datos.items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Brain />
            </EmptyMedia>
            <EmptyTitle>Todavía no hay nada para aprender de memoria</EmptyTitle>
            <EmptyDescription>{esPadre ? "Agregá oraciones del catálogo católico de la casa o un texto propio." : "Cuando mamá o papá agreguen oraciones, aparecen acá."}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="space-y-2">
          {visibles.map((m) => (
            <li key={m.id} className="rounded-xl border bg-card">
              <div className="flex items-center gap-2 p-3">
                <button type="button" onClick={() => setAbierto(abierto === m.id ? null : m.id)} aria-expanded={abierto === m.id} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${abierto === m.id ? "rotate-180" : ""}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{m.titulo}</span>
                    <span className="block text-xs text-muted-foreground">
                      {m.dominada ? "La sabe" : m.toca ? "Toca recitarla hoy" : `Próximo repaso: ${f(m.proximo)}`}
                      {m.repasos > 0 ? ` · ${m.repasos} ${m.repasos === 1 ? "repaso" : "repasos"}` : ""}
                    </span>
                  </span>
                </button>
                {m.dominada ? <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="La sabe" /> : m.toca ? <span className="size-2.5 shrink-0 rounded-full bg-warning" aria-label="Toca hoy" /> : null}
                {esPadre && (
                  <>
                    <Button asChild variant="ghost" size="icon-sm" aria-label={`Hoja para copiar «${m.titulo}»`} title="Hoja para copiar a mano">
                      <Link href={`${base}/memoria/copia/${m.id}`} target="_blank">
                        <PenLine />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Quitar «${m.titulo}»`} onClick={() => quitar(m.id, m.titulo)}>
                      <Trash2 />
                    </Button>
                  </>
                )}
              </div>
              {abierto === m.id && <p className="border-t px-4 py-3 text-sm leading-7 whitespace-pre-wrap text-foreground">{m.texto}</p>}
            </li>
          ))}
        </ul>
      )}

      {esPadre && (
        <AgregarMemoria
          open={agregando}
          alumnos={alumnos}
          alumnoInicial={datos.alumno.id}
          tienen={datos.items.map((i) => i.clave).filter((c): c is string => !!c)}
          onClose={() => setAgregando(false)}
          onGuardado={() => router.refresh()}
        />
      )}
    </div>
  );
}
