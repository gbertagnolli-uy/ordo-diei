"use client";

// Propio de Ordo (lane 182, K2): el boletín de un hijo en un período — se lee en pantalla y se imprime en A4 (blanco y negro) para
// la carpeta de la casa. El comentario del padre se escribe acá y se guarda solo al salir del campo.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { horasTexto } from "@/lib/homeschooling/boletin";
import { letraDe, tonoDe } from "@/lib/homeschooling/calificaciones";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { Boletin, Periodo } from "@/lib/homeschooling/servidor/boletin";
import { toast } from "@/lib/toast";
import GestionPeriodos from "./GestionPeriodos";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const f = (c: string) => FECHA.format(new Date(`${c}T00:00:00Z`));
const TONO = { bien: "text-success", medio: "text-warning", bajo: "text-destructive" } as const;

export default function BoletinVista({ boletin, periodos, alumnos, anio }: { boletin: Boletin | null; periodos: Periodo[]; alumnos: { id: number; nombre: string }[]; anio: number }) {
  const router = useRouter();
  const [comentario, setComentario] = useState(boletin?.comentario ?? "");
  const base = "/dashboard/homeschooling/boletin";

  const guardar = async () => {
    if (!boletin || comentario === (boletin.comentario ?? "")) return;
    try {
      await api(`/api/homeschooling/periodos/${boletin.periodo.id}/boletin/${boletin.alumno.id}`, { method: "PUT", body: { comentario: comentario.trim() || null } });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el comentario");
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-5 p-4 sm:p-6 print:max-w-none print:space-y-3 print:p-0">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <GestionPeriodos periodos={periodos} anio={anio} />
        {periodos.length > 0 && boletin && (
          <nav aria-label="Períodos" className="flex flex-wrap gap-1.5">
            {periodos.map((p) => (
              <Link key={p.id} href={`${base}?alumno=${boletin.alumno.id}&periodo=${p.id}`} aria-current={p.id === boletin.periodo.id ? "page" : undefined} className={`rounded-full border px-3 py-1 text-sm font-medium ${p.id === boletin.periodo.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                {p.nombre}
              </Link>
            ))}
          </nav>
        )}
        {boletin && (
          <Button className="ml-auto" onClick={() => window.print()}>
            <Printer /> Imprimir boletín
          </Button>
        )}
      </div>

      {boletin && alumnos.length > 1 && (
        <nav aria-label="Hijos" className="flex flex-wrap gap-1.5 print:hidden">
          {alumnos.map((a) => (
            <Link key={a.id} href={`${base}?alumno=${a.id}&periodo=${boletin.periodo.id}`} aria-current={a.id === boletin.alumno.id ? "page" : undefined} className={`rounded-full border px-3 py-1 text-sm font-medium ${a.id === boletin.alumno.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
              {a.nombre}
            </Link>
          ))}
        </nav>
      )}

      {!boletin ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">Primero creá los períodos del año con el botón «Períodos».</div>
      ) : (
        <article className="space-y-5 text-foreground print:text-black">
          <header className="space-y-1 border-b-2 border-foreground pb-3 print:border-black">
            <p className="text-xs tracking-widest uppercase">Boletín de estudio</p>
            <h1 className="text-3xl font-bold">{boletin.alumno.nombre}</h1>
            <p className="text-sm">
              {boletin.periodo.nombre} · {f(boletin.periodo.inicio)} al {f(boletin.periodo.fin)}
            </p>
          </header>

          <section aria-label="Resumen" className="sin-corte grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Promedio", boletin.promedio === null ? "—" : `${boletin.promedio.toLocaleString("es")} (${letraDe(boletin.promedio)})`],
              ["Asistencia", boletin.asistencia.porcentaje === null ? "—" : `${boletin.asistencia.porcentaje}% (${boletin.asistencia.diasHechos} de ${boletin.asistencia.diasConClase} días)`],
              ["Horas de estudio", horasTexto(boletin.minutosEstudio)],
              ["Actividades", `${boletin.actividades.cantidad} · ${horasTexto(boletin.actividades.minutos)}`],
            ].map(([t, v]) => (
              <div key={t} className="rounded-xl border p-3 print:rounded-none print:border-black">
                <p className="text-xs text-muted-foreground print:text-black">{t}</p>
                <p className="text-lg font-bold tabular-nums">{v}</p>
              </div>
            ))}
          </section>

          <section aria-label="Materias" className="sin-corte">
            <h2 className="mb-2 text-lg font-bold">Materias</h2>
            {boletin.materias.length === 0 ? (
              <p className="text-sm text-muted-foreground print:text-black">No hubo clases ni notas en este período.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground text-left print:border-black">
                    <th className="py-1.5 pr-2">Materia</th>
                    <th className="py-1.5 pr-2 text-right">Nota</th>
                    <th className="py-1.5 pr-2 text-right">Notas</th>
                    <th className="py-1.5 pr-2 text-right">Días</th>
                    <th className="py-1.5 text-right">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {boletin.materias.map((m) => (
                    <tr key={m.materiaId} className="border-b align-top print:border-black/40">
                      <td className="py-1.5 pr-2">
                        <span className="font-medium">{m.materia}</span>
                        {m.comentarios.length > 0 && <span className="block text-xs text-muted-foreground print:text-black">{m.comentarios.join(" · ")}</span>}
                      </td>
                      <td className={`py-1.5 pr-2 text-right font-bold tabular-nums ${m.promedio === null ? "" : TONO[tonoDe(m.promedio)]} print:text-black`}>{m.promedio === null ? "—" : `${m.promedio.toLocaleString("es")} ${m.letra}`}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">{m.notas.length}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">{m.diasHechos}</td>
                      <td className="py-1.5 text-right tabular-nums">{horasTexto(m.minutos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {(boletin.lectura.terminados.length > 0 || boletin.lectura.paginas > 0) && (
            <section aria-label="Lectura" className="sin-corte">
              <h2 className="mb-1 text-lg font-bold">Lectura</h2>
              <p className="text-sm">
                {boletin.lectura.paginas} páginas leídas
                {boletin.lectura.terminados.length > 0 ? ` · libros terminados: ${boletin.lectura.terminados.join(", ")}` : ""}.
              </p>
            </section>
          )}
          {boletin.memoria.dominadas.length > 0 && (
            <section aria-label="Memoria" className="sin-corte">
              <h2 className="mb-1 text-lg font-bold">Aprendió de memoria</h2>
              <p className="text-sm">{boletin.memoria.dominadas.join(", ")}.</p>
            </section>
          )}

          <section aria-label="Comentario" className="sin-corte space-y-1.5">
            <h2 className="text-lg font-bold">Comentario de papá y mamá</h2>
            <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} onBlur={guardar} rows={4} maxLength={2000} placeholder="Lo que notamos este período…" className="print:hidden" />
            <p className="hidden min-h-24 whitespace-pre-wrap text-sm print:block">{comentario}</p>
          </section>

          <footer className="sin-corte grid grid-cols-2 gap-8 pt-8 text-sm">
            <p className="border-t border-foreground pt-1 text-center print:border-black">Firma de papá</p>
            <p className="border-t border-foreground pt-1 text-center print:border-black">Firma de mamá</p>
          </footer>
        </article>
      )}
    </div>
  );
}
