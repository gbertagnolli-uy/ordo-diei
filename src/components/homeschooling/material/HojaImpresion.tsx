"use client";

// Propio de Ordo (lane 168, P1): la hoja de texto que se manda a la impresora. Abre el diálogo de impresión sola al cargar;
// «Imprimir de nuevo» no cuenta otra (la hoja vale 15 minutos). Solo texto y listas: rinde bien en blanco y negro.
import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HojaImpresa } from "@/lib/homeschooling/servidor/impresiones";
import MarkdownTexto from "./MarkdownTexto";

const FECHA = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function HojaImpresion({ hoja }: { hoja: HojaImpresa }) {
  const { material: m } = hoja;

  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6 p-4 sm:p-6 print:max-w-none print:p-0">
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 print:hidden">
        <p className="text-sm text-muted-foreground">Si no se abrió la impresión, tocá el botón. Esta hoja se puede reimprimir durante 15 minutos sin gastar otra.</p>
        <Button onClick={() => window.print()}>
          <Printer /> Imprimir de nuevo
        </Button>
      </div>

      <article className="space-y-6 text-black print:text-black">
        <header className="space-y-1 border-b-2 border-black pb-3">
          <p className="text-xs tracking-widest uppercase">{hoja.materia ? `${hoja.materia} · ` : ""}Estudio</p>
          <h1 className="text-3xl font-bold">{m.titulo}</h1>
          <p className="text-sm">
            {hoja.alumno} · <span className="capitalize">{FECHA.format(new Date(`${hoja.fecha}T00:00:00Z`))}</span>
          </p>
        </header>

        <MarkdownTexto texto={m.contenido ?? ""} markdown={m.tipo === "markdown"} className="text-base leading-7 text-black" />

        <footer className="sin-corte space-y-6 pt-4 text-sm">
          <p className="font-medium">En tu cuaderno:</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-b border-dotted border-black" />
          ))}
        </footer>
      </article>
    </div>
  );
}
