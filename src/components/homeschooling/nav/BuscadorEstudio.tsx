"use client";

// Propio de Ordo (lane 169, S1): buscador de Estudio. Botón en la barra superior y paleta con ⌘K / Ctrl+K (o «/»): escribís,
// elegís con ↑ ↓ y Enter, y te lleva a la materia, el curso, la lección, el material, la evidencia o la actividad.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, BookOpen, Camera, FileText, GraduationCap, Layers, Paperclip, Search, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { api, consulta } from "@/lib/homeschooling/roost/services/http";
import type { ResultadoBusqueda, TipoResultado } from "@/lib/homeschooling/servidor/buscar";
import { toast } from "@/lib/toast";

const TIPOS: Record<TipoResultado, { etiqueta: string; icono: LucideIcon }> = {
  materia: { etiqueta: "Materias", icono: GraduationCap },
  curso: { etiqueta: "Cursos", icono: Layers },
  leccion: { etiqueta: "Lecciones", icono: BookOpen },
  material: { etiqueta: "Material", icono: Paperclip },
  evidencia: { etiqueta: "Evidencias", icono: Camera },
  actividad: { etiqueta: "Actividades", icono: Activity },
};

export default function BuscadorEstudio() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [activo, setActivo] = useState(0);
  const lista = useRef<HTMLUListElement>(null);

  // ⌘K / Ctrl+K en cualquier lado; «/» cuando no se está escribiendo
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const escribiendo = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAbierto((a) => !a);
      } else if (e.key === "/" && !escribiendo && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setAbierto(true);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  // Búsqueda con espera de 250 ms; la respuesta vieja se descarta si ya hay una nueva
  useEffect(() => {
    const q = texto.trim();
    if (!abierto || q.length < 2) return;
    let vigente = true;
    const t = setTimeout(() => {
      setCargando(true);
      api<ResultadoBusqueda[]>(`/api/homeschooling/buscar${consulta({ q })}`)
        .then((r) => {
          if (!vigente) return;
          setResultados(r);
          setActivo(0);
        })
        .catch((e) => vigente && toast.error(e instanceof Error ? e.message : "No se pudo buscar"))
        .finally(() => vigente && setCargando(false));
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [texto, abierto]);

  const cambiarAbierto = useCallback((o: boolean) => {
    setAbierto(o);
    if (!o) {
      setTexto("");
      setResultados(null);
    }
  }, []);

  const ir = (r: ResultadoBusqueda) => {
    cambiarAbierto(false);
    router.push(r.href);
  };

  const visibles = texto.trim().length >= 2 ? (resultados ?? []) : [];

  const teclado = (e: React.KeyboardEvent) => {
    if (visibles.length === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = (activo + (e.key === "ArrowDown" ? 1 : -1) + visibles.length) % visibles.length;
      setActivo(n);
      lista.current?.querySelector<HTMLElement>(`[data-i="${n}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      ir(visibles[activo]);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="ml-auto gap-2 text-muted-foreground" onClick={() => setAbierto(true)} aria-label="Buscar en Estudio">
        <Search />
        <span className="hidden sm:inline">Buscar…</span>
        <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
      </Button>
      <Dialog open={abierto} onOpenChange={cambiarAbierto}>
        <DialogContent showCloseButton={false} className="top-[15%] max-w-xl translate-y-0 gap-0 p-0 sm:max-w-xl" onKeyDown={teclado}>
          <DialogTitle className="sr-only">Buscar en Estudio</DialogTitle>
          <DialogDescription className="sr-only">Escribí para buscar materias, cursos, lecciones, material, evidencias y actividades.</DialogDescription>
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar materias, lecciones, material, evidencias…"
              aria-label="Buscar en Estudio"
              className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <Kbd>Esc</Kbd>
          </div>
          <div className="max-h-[55svh] overflow-y-auto p-2">
            {texto.trim().length < 2 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Escribí al menos 2 letras. Tip: apretá <Kbd>/</Kbd> desde cualquier pantalla de Estudio.</p>
            ) : cargando && resultados === null ? (
              <div className="space-y-2 p-1">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : visibles.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">{cargando ? "Buscando…" : `No encontré nada para «${texto.trim()}».`}</p>
            ) : (
              <ul ref={lista} role="listbox" aria-label="Resultados" className="space-y-0.5">
                {visibles.map((r, i) => {
                  const T = TIPOS[r.tipo];
                  const cabecera = i === 0 || visibles[i - 1].tipo !== r.tipo;
                  return (
                    <li key={`${r.tipo}-${r.id}`} role="presentation">
                      {cabecera && <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{T.etiqueta}</p>}
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === activo}
                        data-i={i}
                        onMouseMove={() => setActivo(i)}
                        onClick={() => ir(r)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${i === activo ? "bg-primary/10" : ""}`}
                      >
                        <T.icono className="size-4 shrink-0 text-primary" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{r.titulo}</span>
                          {r.detalle && <span className="block truncate text-xs text-muted-foreground">{r.detalle}</span>}
                        </span>
                        {r.tipo === "material" && <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
