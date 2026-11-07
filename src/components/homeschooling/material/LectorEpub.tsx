"use client";

// Propio de Ordo (lane 189, M2b): lector de ePub dentro de la app (epub.js). El libro se baja de la ruta de la app, no del sitio de
// origen, así no hay problemas de CORS. Páginas con ← / → o con los botones, tamaño de letra y tabla de contenidos.
// Pensado para leer un capítulo, no para pasar horas en pantalla: la lectura larga es en papel.
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ListTree, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Capitulo = { label: string; href: string };
type Ubicacion = { start: { cfi: string } };
type Rend = {
  display: (t?: string) => Promise<unknown>;
  next: () => Promise<unknown>;
  prev: () => Promise<unknown>;
  themes: { fontSize: (s: string) => void };
  on: (evento: "relocated", f: (u: Ubicacion) => void) => void;
  currentLocation: () => Ubicacion | null;
  destroy: () => void;
};
type Ubicaciones = { generate: (n: number) => Promise<unknown>; length: () => number; percentageFromCfi: (cfi: string) => number };

/**
 * `cfiInicial` y `onPosicion` (lane 270, D4): abrir donde se dejó y avisar cada cambio de página con el CFI y el
 * porcentaje (0–100; 0 hasta que epub.js termina de calcular las ubicaciones del libro).
 */
export default function LectorEpub({
  origen,
  titulo,
  cfiInicial,
  onPosicion,
}: {
  origen: string;
  titulo: string;
  cfiInicial?: string | null;
  onPosicion?: (cfi: string, porcentaje: number) => void;
}) {
  const zona = useRef<HTMLDivElement>(null);
  const rend = useRef<Rend | null>(null);
  const avisar = useRef(onPosicion);
  useEffect(() => {
    avisar.current = onPosicion;
  }, [onPosicion]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [error, setError] = useState("");
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [verIndice, setVerIndice] = useState(false);
  const [tamano, setTamano] = useState(120);

  useEffect(() => {
    let vivo = true;
    let book: { destroy: () => void } | null = null;
    (async () => {
      try {
        const res = await fetch(origen);
        if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error || "No se pudo abrir el libro");
        const datos = await res.arrayBuffer();
        const { default: Epub } = await import("epubjs");
        if (!vivo || !zona.current) return;
        const b = Epub(datos);
        book = b as unknown as { destroy: () => void };
        const r = b.renderTo(zona.current, { width: "100%", height: "100%", flow: "paginated", spread: "none", allowScriptedContent: false }) as unknown as Rend;
        rend.current = r;
        r.themes.fontSize(`${tamano}%`);
        const ubicaciones = b.locations as unknown as Ubicaciones;
        const porcentaje = (cfi: string) => (ubicaciones.length() > 0 ? Math.round(ubicaciones.percentageFromCfi(cfi) * 1000) / 10 : 0);
        r.on("relocated", (u) => avisar.current?.(u.start.cfi, porcentaje(u.start.cfi)));
        try {
          await r.display(cfiInicial ?? undefined);
        } catch {
          await r.display(); // un CFI viejo que ya no existe: se abre al principio
        }
        const nav = await b.loaded.navigation;
        if (vivo) setCapitulos(nav.toc.map((t) => ({ label: t.label.trim(), href: t.href })));
        if (vivo) setEstado("listo");
        if (avisar.current) {
          // Las ubicaciones (para el porcentaje) se calculan después de mostrar el libro, sin trabar la lectura.
          await ubicaciones.generate(1600);
          const actual = vivo ? r.currentLocation() : null;
          if (actual?.start) avisar.current?.(actual.start.cfi, porcentaje(actual.start.cfi));
        }
      } catch (e) {
        if (!vivo) return;
        setError(e instanceof Error ? e.message : "No se pudo abrir el libro");
        setEstado("error");
      }
    })();
    return () => {
      vivo = false;
      rend.current?.destroy();
      rend.current = null;
      book?.destroy();
    };
    // El tamaño de letra se aplica aparte (sin volver a bajar el libro)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origen]);

  useEffect(() => {
    rend.current?.themes.fontSize(`${tamano}%`);
  }, [tamano]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") void rend.current?.next();
      if (e.key === "ArrowLeft") void rend.current?.prev();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const ir = async (href: string) => {
    setVerIndice(false);
    await rend.current?.display(href);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => void rend.current?.prev()} disabled={estado !== "listo"} aria-label="Página anterior">
          <ArrowLeft />
        </Button>
        <Button variant="outline" size="sm" onClick={() => void rend.current?.next()} disabled={estado !== "listo"} aria-label="Página siguiente">
          <ArrowRight />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setVerIndice((v) => !v)} disabled={capitulos.length === 0} aria-expanded={verIndice}>
          <ListTree /> Índice
        </Button>
        <span className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Letra más chica" onClick={() => setTamano((t) => Math.max(80, t - 10))}>
            <Minus />
          </Button>
          <span className="w-10 text-center text-xs text-muted-foreground tabular-nums">{tamano}%</span>
          <Button variant="ghost" size="icon-sm" aria-label="Letra más grande" onClick={() => setTamano((t) => Math.min(220, t + 10))}>
            <Plus />
          </Button>
        </span>
      </div>

      {verIndice && (
        <ul className="max-h-60 overflow-y-auto rounded-xl border bg-card p-1 text-sm">
          {capitulos.map((c, i) => (
            <li key={`${c.href}-${i}`}>
              <button type="button" onClick={() => void ir(c.href)} className="w-full rounded-lg px-3 py-2 text-left hover:bg-muted">
                {c.label || `Sección ${i + 1}`}
              </button>
            </li>
          ))}
        </ul>
      )}

      {estado === "cargando" && <Skeleton className="h-[60svh] w-full rounded-xl" />}
      {estado === "error" && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
          {error}
        </p>
      )}
      <div ref={zona} aria-label={`Libro: ${titulo}`} className={`h-[68svh] w-full overflow-hidden rounded-xl border bg-white text-black ${estado === "listo" ? "" : "hidden"}`} />
      <p className="text-center text-xs text-muted-foreground">← → pasan de página. Para leer mucho, mejor en papel.</p>
    </div>
  );
}
