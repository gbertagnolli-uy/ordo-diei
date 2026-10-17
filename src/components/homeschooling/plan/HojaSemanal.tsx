"use client";

// Propio de Ordo (lane 173, P2): la semana de un hijo en una hoja. En pantalla se navega de semana en semana; impresa (A4,
// blanco y negro) queda lista para pegar en la heladera: un cuadro por día con casilla para tildar a mano, los minutos y el
// material. Sin pantalla: se hace con lápiz y cuaderno.
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HojaSemana } from "@/lib/homeschooling/servidor/semana";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", timeZone: "UTC" });
const f = (c: string) => FECHA.format(new Date(`${c}T00:00:00Z`));
const horas = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ""}` : `${min} min`);

export default function HojaSemanal({ hoja, alumnos, hoy }: { hoja: HojaSemana; alumnos: { id: number; nombre: string }[]; hoy: string }) {
  const base = "/dashboard/homeschooling/semana";
  const dias = hoja.dias.filter((d, i) => i < 5 || d.items.length > 0 || d.actividades.length > 0 || d.sueltos.length > 0);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-5 p-4 sm:p-6 print:max-w-none print:space-y-3 print:p-0">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button asChild variant="outline" size="icon-sm" aria-label="Semana anterior">
          <Link href={`${base}?alumno=${hoja.alumno.id}&desde=${hoja.anterior}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon-sm" aria-label="Semana siguiente">
          <Link href={`${base}?alumno=${hoja.alumno.id}&desde=${hoja.siguiente}`}>
            <ChevronRight />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`${base}?alumno=${hoja.alumno.id}&desde=${hoy}`}>Esta semana</Link>
        </Button>
        {alumnos.length > 1 && (
          <nav aria-label="Hijos" className="flex flex-wrap gap-1.5">
            {alumnos.map((a) => (
              <Link
                key={a.id}
                href={`${base}?alumno=${a.id}&desde=${hoja.desde}`}
                aria-current={a.id === hoja.alumno.id ? "page" : undefined}
                className={`rounded-full border px-3 py-1 text-sm font-medium ${a.id === hoja.alumno.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                {a.nombre}
              </Link>
            ))}
          </nav>
        )}
        <Button className="ml-auto" onClick={() => window.print()}>
          <Printer /> Imprimir la semana
        </Button>
      </div>

      <header className="space-y-0.5 border-b-2 border-foreground pb-2 print:border-black">
        <h1 className="text-2xl font-bold text-foreground print:text-black">Semana de {hoja.alumno.nombre}</h1>
        <p className="text-sm text-muted-foreground print:text-black">
          Del {f(hoja.desde)} al {f(hoja.hasta)} · {hoja.minutosTotales > 0 ? `${horas(hoja.minutosTotales)} de estudio` : "sin clases programadas"}
        </p>
      </header>

      <div className="space-y-3 print:space-y-2">
        {dias.map((d) => (
          <section key={d.fecha} aria-label={d.etiqueta} className="sin-corte overflow-hidden rounded-xl border print:rounded-none print:border-black">
            <h2 className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5 text-sm font-semibold capitalize text-foreground print:border-black print:bg-transparent print:text-black">
              {d.etiqueta}
              {d.fecha === hoy && <span className="rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground print:hidden">hoy</span>}
            </h2>
            {d.sinClase ? (
              <p className="px-3 py-2 text-sm text-muted-foreground print:text-black">Sin clase: {d.sinClase}</p>
            ) : d.items.length === 0 && d.sueltos.length === 0 && d.actividades.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground print:text-black">Nada programado.</p>
            ) : (
              <ul className="divide-y print:divide-black/40">
                {d.items.map((it, i) => (
                  <li key={i} className="flex gap-3 px-3 py-2 text-sm">
                    <span aria-hidden className="mt-0.5 size-4 shrink-0 rounded-sm border-2 border-foreground print:border-black">
                      {it.hecho && <span className="block text-center text-[11px] leading-3 print:hidden">✓</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground print:text-black">
                        {it.materia}: {it.curso} <span className="font-normal text-muted-foreground print:text-black">· {it.rango} · {horas(it.minutos)}</span>
                      </p>
                      {it.lecciones.length > 0 && (
                        <p className="text-muted-foreground print:text-black">{it.lecciones.map((l) => `${l.orden}. ${l.titulo}`).join(" · ")}</p>
                      )}
                      {it.material.length > 0 && <p className="text-muted-foreground print:text-black">Material: {it.material.join(", ")}</p>}
                    </div>
                  </li>
                ))}
                {d.sueltos.map((t, i) => (
                  <li key={`s${i}`} className="flex gap-3 px-3 py-2 text-sm">
                    <span aria-hidden className="mt-0.5 size-4 shrink-0 rounded-sm border-2 border-foreground print:border-black" />
                    <p className="font-medium text-foreground print:text-black">{t}</p>
                  </li>
                ))}
                {d.actividades.map((x, i) => (
                  <li key={`a${i}`} className="px-3 py-2 text-sm text-foreground print:text-black">
                    <span className="font-medium">Actividad:</span> {x.titulo} · {x.hora}
                    {x.lugar ? ` · ${x.lugar}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
