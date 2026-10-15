"use client";

// Propio de Ordo (lane 178, P3): la hoja del día para el cuaderno — qué toca, las instrucciones de cada lección, el texto que dejó
// el padre y renglones para escribir. Blanco y negro, A4. Se abre sola la impresión; «Imprimir de nuevo» no gasta otra.
import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HojaDia } from "@/lib/homeschooling/servidor/hojaDia";
import MarkdownTexto from "./MarkdownTexto";

const FECHA = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function HojaDelDia({ hoja }: { hoja: HojaDia }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  const minutos = hoja.minutos >= 60 ? `${Math.floor(hoja.minutos / 60)} h ${hoja.minutos % 60 ? `${hoja.minutos % 60} min` : ""}`.trim() : `${hoja.minutos} min`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-5 p-4 sm:p-6 print:max-w-none print:p-0">
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 print:hidden">
        <p className="text-sm text-muted-foreground">Si no se abrió la impresión, tocá el botón. Esta hoja se puede reimprimir durante 15 minutos sin gastar otra.</p>
        <Button onClick={() => window.print()}>
          <Printer /> Imprimir de nuevo
        </Button>
      </div>

      <article className="space-y-5 text-black">
        <header className="space-y-1 border-b-2 border-black pb-3">
          <p className="text-xs tracking-widest uppercase">{hoja.materia} · hoja del día</p>
          <h1 className="text-3xl font-bold">{hoja.curso}</h1>
          <p className="text-sm">
            {hoja.alumno} · <span className="capitalize">{FECHA.format(new Date(`${hoja.fecha}T00:00:00Z`))}</span>
          </p>
          <p className="text-sm font-medium">
            Hoy: {hoja.rango} · unos {minutos}
          </p>
        </header>

        {hoja.lecciones.map((l) => (
          <section key={l.orden} className="sin-corte space-y-2">
            <h2 className="flex items-start gap-2 text-lg font-bold">
              <span aria-hidden className="mt-1 size-4 shrink-0 rounded-sm border-2 border-black" />
              {l.orden}. {l.titulo}
            </h2>
            {l.instrucciones && <p className="pl-6 text-sm whitespace-pre-wrap">{l.instrucciones}</p>}
            {l.textos.map((t, i) => (
              <div key={i} className="pl-6">
                <MarkdownTexto texto={t.contenido} markdown={t.markdown} className="text-sm leading-6 text-black" />
              </div>
            ))}
            {l.enlaces.length > 0 && <p className="pl-6 text-sm">Material en la app: {l.enlaces.join(", ")}.</p>}
          </section>
        ))}

        {hoja.lecciones.length === 0 && (
          <section className="sin-corte flex items-start gap-2">
            <span aria-hidden className="mt-1 size-4 shrink-0 rounded-sm border-2 border-black" />
            <p className="text-lg font-bold">{hoja.rango}</p>
          </section>
        )}

        {hoja.textosDelDia.map((t, i) => (
          <section key={i} className="sin-corte space-y-1">
            <h2 className="text-lg font-bold">{t.titulo}</h2>
            <MarkdownTexto texto={t.contenido} markdown={t.markdown} className="text-sm leading-6 text-black" />
          </section>
        ))}
        {hoja.enlacesDelDia.length > 0 && <p className="text-sm">Material en la app: {hoja.enlacesDelDia.join(", ")}.</p>}

        <footer className="sin-corte space-y-6 pt-3 text-sm">
          <p className="font-medium">En tu cuaderno:</p>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-b border-dotted border-black" />
          ))}
          <p className="flex justify-between pt-2">
            <span>Hecho ☐</span>
            <span>Revisó: ______________</span>
          </p>
        </footer>
      </article>
    </div>
  );
}
