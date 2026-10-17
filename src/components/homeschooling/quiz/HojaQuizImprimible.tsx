"use client";

// Propio de Ordo (lane 230): hoja imprimible A4 de Quiz, Evaluación (Assessment) u Hoja de Clase completa.
// Permite alternar entre: (1) Evaluación para el alumno (sin respuestas), (2) Clave de corrección para padres
// (con respuesta correcta y explicación) y (3) Hoja de clase completa (lectura/tarea + imágenes + evaluación).

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileText, KeyRound, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import MarkdownTexto from "@/components/homeschooling/material/MarkdownTexto";

export type PreguntaImprimible = {
  id: number;
  orden: number;
  enunciado: string;
  opciones: string[];
  correcta?: number;
  explicacion?: string | null;
  segundoVideo: number | null;
};

export type MaterialImprimible = {
  id: number;
  titulo: string;
  tipo: string;
  proveedor: string | null;
  url: string | null;
  contenido: string | null;
};

export type DatosQuizImprimible = {
  leccionId: number;
  orden: number;
  titulo: string;
  instrucciones: string | null;
  imagenUrl: string | null;
  cursoId: number;
  cursoTitulo: string;
  umbralAprobacion: number;
  materiaId: number;
  materiaNombre: string;
  esPadre: boolean;
  modoInicial: "alumno" | "clave" | "clase";
  preguntas: PreguntaImprimible[];
  materiales: MaterialImprimible[];
};

const LETRAS = ["A", "B", "C", "D"];

export default function HojaQuizImprimible({ datos }: { datos: DatosQuizImprimible }) {
  const [modo, setModo] = useState<"alumno" | "clave" | "clase">(
    !datos.esPadre && datos.modoInicial === "clave" ? "alumno" : datos.modoInicial
  );
  const [incluirConsigna, setIncluirConsigna] = useState(true);
  const [lineasDesarrollo, setLineasDesarrollo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => window.print(), 450);
    return () => clearTimeout(t);
  }, []);

  const mostrarClave = datos.esPadre && modo === "clave";
  const mostrarMateriales = modo === "clase";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6 p-4 sm:p-6 print:max-w-none print:p-0">
      <div className="space-y-3 rounded-xl border bg-card p-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/homeschooling/materias/${datos.materiaId}?module=${datos.cursoId}&lesson=${datos.leccionId}`}>
              <ArrowLeft /> Volver a la clase
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={modo === "alumno" ? "default" : "outline"}
              onClick={() => setModo("alumno")}
            >
              <ClipboardCheck className="size-4" /> Evaluación (Alumno)
            </Button>
            {datos.esPadre && (
              <Button
                type="button"
                size="sm"
                variant={modo === "clave" ? "default" : "outline"}
                onClick={() => setModo("clave")}
              >
                <KeyRound className="size-4" /> Clave de respuestas
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant={modo === "clase" ? "default" : "outline"}
              onClick={() => setModo("clase")}
            >
              <FileText className="size-4" /> Hoja de clase completa
            </Button>
            <Button type="button" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" /> Imprimir
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 border-t pt-3 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <Switch checked={incluirConsigna} onCheckedChange={setIncluirConsigna} />
            <span>Incluir consigna / descripción de la clase</span>
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={lineasDesarrollo} onCheckedChange={setLineasDesarrollo} />
            <span>Agregar renglones de respuesta / desarrollo escrito</span>
          </label>
        </div>
      </div>

      <article className="space-y-6 text-black print:text-black">
        <header className="space-y-3 border-b-2 border-black pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase">
                {datos.materiaNombre} · {datos.cursoTitulo}
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                {modo === "clase"
                  ? `Clase ${datos.orden}: ${datos.titulo}`
                  : mostrarClave
                    ? `Clave de Corrección — ${datos.titulo}`
                    : `Evaluación / Quiz — ${datos.titulo}`}
              </h1>
            </div>
            {!mostrarClave && (
              <div className="rounded border border-black px-3 py-1.5 text-right text-xs">
                <p className="font-semibold">Calificación: ______ / 100</p>
                <p className="text-[11px]">Aprobación: {datos.umbralAprobacion}%</p>
              </div>
            )}
          </div>

          {!mostrarClave ? (
            <div className="grid grid-cols-1 gap-3 pt-1 text-sm sm:grid-cols-2">
              <p className="border-b border-dotted border-black pb-1">
                <span className="font-semibold">Alumno/a:</span>{" "}
              </p>
              <p className="border-b border-dotted border-black pb-1">
                <span className="font-semibold">Fecha:</span> ____ / ____ / ________
              </p>
            </div>
          ) : (
            <p className="text-xs font-medium uppercase">
              Uso exclusivo del padre / docente · Umbral de aprobación: {datos.umbralAprobacion}%
            </p>
          )}
        </header>

        {incluirConsigna && datos.instrucciones && (
          <section className="space-y-2 rounded-lg border border-black/30 p-3.5">
            <h2 className="text-xs font-bold tracking-wider uppercase">Consigna y descripción de la clase</h2>
            <MarkdownTexto texto={datos.instrucciones} markdown className="text-sm leading-6 text-black" />
          </section>
        )}

        {datos.imagenUrl && (modo === "clase" || incluirConsigna) && (
          <figure className="sin-corte flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={datos.imagenUrl}
              alt={datos.titulo}
              className="max-h-72 w-auto rounded border border-black/20 object-contain"
            />
          </figure>
        )}

        {mostrarMateriales && datos.materiales.length > 0 && (
          <section className="space-y-4">
            <h2 className="border-b border-black pb-1 text-sm font-bold tracking-wider uppercase">
              Material de lectura y actividades
            </h2>
            {datos.materiales.map((m) => (
              <div key={m.id} className="sin-corte space-y-2 rounded-lg border border-black/25 p-3.5">
                <h3 className="text-base font-bold">{m.titulo}</h3>
                {m.proveedor === "imagen" && m.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.titulo} className="max-h-72 w-auto rounded border border-black/20 object-contain" />
                )}
                {m.contenido && (
                  <MarkdownTexto texto={m.contenido} markdown={m.tipo === "markdown"} className="text-sm leading-6 text-black" />
                )}
                {!m.contenido && m.proveedor !== "imagen" && m.url && (
                  <p className="text-xs text-black/80">Recurso adjunto: {m.titulo}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {datos.preguntas.length > 0 ? (
          <section className="space-y-5">
            <h2 className="border-b border-black pb-1 text-sm font-bold tracking-wider uppercase">
              {mostrarClave ? "Preguntas y respuestas correctas" : "Cuestionario de evaluación"} ({datos.preguntas.length}{" "}
              {datos.preguntas.length === 1 ? "pregunta" : "preguntas"})
            </h2>
            <ol className="space-y-5">
              {datos.preguntas.map((p, idx) => (
                <li key={p.id} className="sin-corte space-y-2.5 border-b border-black/15 pb-4 last:border-b-0">
                  <p className="text-base font-semibold">
                    {idx + 1}. {p.enunciado}
                  </p>
                  <ul className="space-y-1.5 pl-2">
                    {p.opciones.map((op, k) => {
                      const esCorrecta = mostrarClave && p.correcta === k;
                      return (
                        <li
                          key={k}
                          className={`flex items-start gap-2.5 rounded px-2 py-1 text-sm ${
                            esCorrecta ? "border border-black font-semibold" : ""
                          }`}
                        >
                          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-black text-[11px] font-bold">
                            {esCorrecta ? "✓" : ""}
                          </span>
                          <span>
                            <strong className="mr-1">{LETRAS[k] ?? k + 1})</strong> {op}
                          </span>
                          {esCorrecta && (
                            <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold uppercase">
                              <CheckCircle2 className="size-3.5" /> Correcta
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {mostrarClave && p.explicacion && (
                    <p className="rounded bg-black/5 px-3 py-1.5 text-xs italic">
                      <strong>Explicación:</strong> {p.explicacion}
                    </p>
                  )}
                  {lineasDesarrollo && !mostrarClave && (
                    <div className="space-y-3 pt-2 pl-2">
                      <p className="text-xs font-medium">Justificación / desarrollo:</p>
                      <div className="border-b border-dotted border-black" />
                      <div className="border-b border-dotted border-black" />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section className="space-y-4">
            <h2 className="border-b border-black pb-1 text-sm font-bold tracking-wider uppercase">
              Actividad / Desarrollo en hoja
            </h2>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 border-b border-dotted border-black" />
            ))}
          </section>
        )}

        {!mostrarClave && (
          <footer className="sin-corte space-y-4 border-t border-black pt-4 text-xs">
            <p className="font-semibold">Observaciones y devolución:</p>
            <div className="h-5 border-b border-dotted border-black" />
            <div className="h-5 border-b border-dotted border-black" />
          </footer>
        )}
      </article>
    </div>
  );
}
