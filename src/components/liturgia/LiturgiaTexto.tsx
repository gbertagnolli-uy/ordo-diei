"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Bloque, DocumentoResuelto, Segmento } from "@/lib/liturgia/tipos";

type Modo = "ambos" | "la" | "es";

/**
 * Lector bilingüe de un `Documento` (SPEC §9.1). Ambos (dos columnas alineadas por bloque en ≥ lg,
 * latín y debajo el español en móvil), solo latín o solo español. Rúbricas en `--rubrica`.
 * Los bloques sin traducción dicen «sin traducción» y nunca se muestra inglés como español (D52).
 */
export function LiturgiaTexto({ documento, className }: { documento: DocumentoResuelto; className?: string }) {
  const [modo, setModo] = useState<Modo>("ambos");
  const secciones = documento.secciones.filter((s) => s.bloques.length > 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="sticky top-0 z-10 -mx-1 space-y-2 bg-background/95 px-1 py-2 backdrop-blur">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={modo}
          // Radix deja el valor vacío al volver a pulsar el activo: se ignora.
          onValueChange={(v) => v && setModo(v as Modo)}
          aria-label="Idioma del texto"
        >
          <ToggleGroupItem value="ambos">Ambos</ToggleGroupItem>
          <ToggleGroupItem value="la">Latín</ToggleGroupItem>
          <ToggleGroupItem value="es">Español</ToggleGroupItem>
        </ToggleGroup>
        {secciones.length > 1 && (
          // Sin barra de scroll. Cuando la lane 109 integre `ui/drag-scroll` conviene usarlo acá (arrastrar con el mouse).
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {secciones.map((s) => (
              <Button
                key={s.clave}
                variant="outline"
                size="sm"
                className="h-7 shrink-0 rounded-full text-xs"
                onClick={() => document.getElementById(idSeccion(s.clave))?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                {s.tituloLa}
              </Button>
            ))}
          </div>
        )}
      </div>

      {secciones.map((s) => (
        <section key={s.clave} id={idSeccion(s.clave)} className="scroll-mt-28 space-y-3 [contain-intrinsic-size:auto_600px] [content-visibility:auto]">
          <h2 className="border-b pb-1 font-heading text-lg font-semibold">
            <span lang="la">{s.tituloLa}</span>
            {s.tituloEs && modo !== "la" && (
              <span className="ml-2 text-sm font-normal text-muted-foreground" lang="es">
                {s.tituloEs}
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {s.bloques.map((b, i) => (
              <FilaBloque key={i} bloque={b} modo={modo} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const idSeccion = (clave: string) => `sec-${clave.replace(/[^\p{L}\p{N}_-]/gu, "-")}`;

function FilaBloque({ bloque, modo }: { bloque: Bloque; modo: Modo }) {
  const conEspanol = modo !== "la";
  const conLatin = modo !== "es";
  return (
    <div className={cn("grid gap-x-8 gap-y-1", modo === "ambos" && "lg:grid-cols-2")}>
      {conLatin && (
        <div lang="la" className={textoLectura}>
          <Segmentos segs={bloque.la} />
        </div>
      )}
      {conEspanol && (
        <div lang="es" className={cn(textoLectura, modo === "ambos" && "pl-4 text-foreground/80 lg:pl-0 lg:text-foreground")}>
          {bloque.es ? <Segmentos segs={bloque.es} /> : <SinTraduccion />}
        </div>
      )}
    </div>
  );
}

const textoLectura = "max-w-prose font-serif text-[1.0625rem] leading-relaxed sm:text-[1.125rem]";

function SinTraduccion() {
  return <span className="font-sans text-sm italic text-muted-foreground">sin traducción</span>;
}

function Segmentos({ segs }: { segs: Segmento[] }) {
  return (
    <>
      {segs.map((s, i) => (
        <SegmentoVista key={i} s={s} />
      ))}
    </>
  );
}

/** Marca roja (℣ ℟ Ant.) seguida del texto. */
function Marcado({ marca, v }: { marca: string; v: string }) {
  return (
    <p>
      <span className="mr-1.5 text-rubrica">{marca}</span>
      {v}
    </p>
  );
}

function SegmentoVista({ s }: { s: Segmento }) {
  switch (s.t) {
    case "texto":
      return <p>{s.v}</p>;
    case "rubrica":
      return <p className="text-[0.92em] italic text-rubrica">{s.v}</p>;
    case "versiculo":
      return <Marcado marca="℣." v={s.v} />;
    case "responsorio":
      return <Marcado marca="℟." v={s.v} />;
    case "antifona":
      return <Marcado marca="Ant." v={s.v} />;
    case "verso":
      return (
        <p>
          <sup className="mr-1 font-sans text-[0.65em] text-rubrica">{s.num}</sup>
          {s.v}
        </p>
      );
    case "titulo":
      return <p className="pt-1 font-heading text-base font-semibold">{s.v}</p>;
    case "cruz":
      return <p className="text-rubrica">✠</p>;
    case "falta":
      return <SinTraduccion />;
  }
}
