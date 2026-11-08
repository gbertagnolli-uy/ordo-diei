"use client";
// Diario (lane 272, rehecho en la lane 283): hoja para escribir o editar una entrada.
// UX basada en Demizo/Daily_You@7cc237d (lib/pages/edit_entry_page.dart): autoguardado a los 5 s y al salir, fecha y hora editables.
// El texto es el editor Tiptap portado de moodiary (ver ./editor/EditorTexto.tsx).
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Pin, Star, Tags, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { textoPlanoDe, tieneImagen, type NodoDoc } from "@/lib/diario/contenido";
import type { EtiquetaPuesta } from "@/lib/diario/etiquetas";
import { MAX_FOTOS, MAX_TITULO, type TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { EditorTexto } from "./editor/EditorTexto";
import { subirImagen } from "./editor/subir";
import { ChipEtiqueta } from "./etiquetas/ChipEtiqueta";
import { SelectorCategoria } from "./etiquetas/SelectorCategoria";
import { SelectorEtiquetas } from "./etiquetas/SelectorEtiquetas";
import type { AccionesCatalogo } from "./etiquetas/useCatalogo";
import { SelectorAnimo } from "./SelectorAnimo";

const AUTOGUARDADO_MS = 5000;

const aHoraTexto = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const deHoraTexto = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return Number.isInteger(h) && Number.isInteger(m) ? h * 60 + m : null;
};
const ahoraEnMinutos = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

/** Se monta con una `key` nueva cada vez que se abre, así el estado inicial sale de las props. */
export function EditorEntrada({
  abierto,
  tipo,
  entrada,
  fecha,
  hoy,
  acciones,
  onAdministrar,
  onCerrar,
}: {
  abierto: boolean;
  tipo: TipoDiario;
  entrada?: EntradaVista;
  fecha: string;
  hoy: string;
  /** Catálogo de etiquetas y categorías (lane 284). */
  acciones: AccionesCatalogo;
  onAdministrar: (pestana: "etiquetas" | "categorias") => void;
  /** `huboCambios`: se guardó algo, hay que recargar la lista. */
  onCerrar: (huboCambios: boolean) => void;
}) {
  const [animo, setAnimo] = useState<number | null>(entrada?.animo ?? null);
  const [titulo, setTitulo] = useState(entrada?.titulo ?? "");
  const [dia, setDia] = useState(entrada?.fecha ?? fecha);
  const [hora, setHora] = useState<number>(entrada?.hora ?? ahoraEnMinutos());
  const [fotos, setFotos] = useState<string[]>(entrada?.fotos ?? []);
  const [etiquetas, setEtiquetas] = useState<EtiquetaPuesta[]>(entrada?.etiquetas ?? []);
  const [categoriaId, setCategoriaId] = useState<number | null>(entrada?.categoriaId ?? null);
  const [favorita, setFavorita] = useState(entrada?.favorita ?? false);
  const [fijada, setFijada] = useState(entrada?.fijada ?? false);
  const [eligiendoEtiquetas, setEligiendoEtiquetas] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [estado, setEstado] = useState<"" | "guardando" | "guardado">("");

  // Lo último que se escribió, para que el guardado diferido no use valores viejos
  const doc = useRef<NodoDoc | null>(entrada?.contenido ?? null);
  const campos = useRef({ animo, titulo, dia, hora, fotos, etiquetas, categoriaId, favorita, fijada });
  useEffect(() => {
    campos.current = { animo, titulo, dia, hora, fotos, etiquetas, categoriaId, favorita, fijada };
  }, [animo, titulo, dia, hora, fotos, etiquetas, categoriaId, favorita, fijada]);
  // El catálogo puede haber cambiado desde que se abrió la entrada (se borró una etiqueta): solo se guardan las que siguen existiendo
  const catalogo = useRef(acciones.catalogo);
  catalogo.current = acciones.catalogo;

  const id = useRef<number | null>(entrada?.id ?? null);
  const version = useRef(0); // sube con cada cambio
  const guardadoHasta = useRef(0); // última versión guardada
  const cola = useRef<Promise<void>>(Promise.resolve()); // un guardado a la vez: evita crear la misma entrada dos veces
  const temporizador = useRef(0);
  const huboCambios = useRef(false);

  const vacia = () => {
    const { fotos: f } = campos.current;
    const d = doc.current;
    const sinTexto = d ? !textoPlanoDe(d).trim() && !tieneImagen(d) : !(entrada?.texto ?? "").trim();
    return sinTexto && f.length === 0;
  };

  const guardarAhora = useCallback((): Promise<void> => {
    window.clearTimeout(temporizador.current);
    cola.current = cola.current.then(async () => {
      const v = version.current;
      if (v === guardadoHasta.current || vacia()) return;
      setEstado("guardando");
      try {
        const c = campos.current;
        const cuerpo = {
          tipo,
          fecha: c.dia,
          hora: c.hora,
          titulo: c.titulo,
          animo: c.animo,
          fotos: c.fotos,
          etiquetas: catalogo.current ? c.etiquetas.filter((t) => catalogo.current!.etiquetas.some((e) => e.id === t.id)) : c.etiquetas,
          categoriaId: catalogo.current && !catalogo.current.categorias.some((x) => x.id === c.categoriaId) ? null : c.categoriaId,
          favorita: c.favorita,
          fijada: c.fijada,
          ...(doc.current ? { contenido: doc.current } : { texto: entrada?.texto ?? "" }),
        };
        const r = await fetch(id.current ? `/api/diario/${id.current}` : "/api/diario", {
          method: id.current ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(cuerpo),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudo guardar");
        id.current = d.entrada.id;
        guardadoHasta.current = v;
        huboCambios.current = true;
        setEstado("guardado");
      } catch (e) {
        setEstado("");
        toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
    return cola.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `vacia` solo lee refs
  }, [tipo, entrada?.texto]);

  const cambio = useCallback(() => {
    version.current += 1;
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => void guardarAhora(), AUTOGUARDADO_MS);
  }, [guardarAhora]);

  // Guardar al salir de la pestaña (en el celular, al cambiar de app)
  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === "hidden") void guardarAhora();
    };
    document.addEventListener("visibilitychange", alOcultar);
    return () => {
      document.removeEventListener("visibilitychange", alOcultar);
      window.clearTimeout(temporizador.current);
    };
  }, [guardarAhora]);

  async function cerrar() {
    await guardarAhora();
    onCerrar(huboCambios.current);
  }

  async function subirFotos(archivos: FileList | null) {
    if (!archivos?.length) return;
    setSubiendo(true);
    try {
      const nuevas: string[] = [];
      for (const f of Array.from(archivos).slice(0, MAX_FOTOS - fotos.length)) nuevas.push(await subirImagen(f));
      setFotos((x) => [...x, ...nuevas]);
      cambio();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={(v) => !v && void cerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{entrada ? "Editar entrada" : "Nueva entrada"}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <SelectorAnimo
            valor={animo}
            onCambio={(v) => {
              setAnimo(v);
              cambio();
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={favorita}
              onClick={() => {
                setFavorita(!favorita);
                cambio();
              }}
            >
              <Star className={cn(favorita && "fill-current text-warning")} /> Favorita
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={fijada}
              onClick={() => {
                setFijada(!fijada);
                cambio();
              }}
            >
              <Pin className={cn(fijada && "fill-current text-primary")} /> Fijar arriba
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Fecha
              <Input
                type="date"
                value={dia}
                min="2000-01-01"
                max={hoy}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setDia(e.target.value);
                  cambio();
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Hora
              <Input
                type="time"
                value={aHoraTexto(hora)}
                onChange={(e) => {
                  const m = deHoraTexto(e.target.value);
                  if (m === null) return;
                  setHora(m);
                  cambio();
                }}
              />
            </label>
          </div>
          <Input
            placeholder="Título (opcional)"
            value={titulo}
            maxLength={MAX_TITULO}
            onChange={(e) => {
              setTitulo(e.target.value);
              cambio();
            }}
          />
          <EditorTexto
            inicial={{ contenido: entrada?.contenido ?? null, texto: entrada?.texto ?? "" }}
            onCambio={(d) => {
              doc.current = d;
              cambio();
            }}
          />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {etiquetas.map((t) => {
                const e = acciones.catalogo?.etiquetas.find((x) => x.id === t.id);
                return e ? <ChipEtiqueta key={t.id} etiqueta={e} valor={t.valor} onQuitar={() => { setEtiquetas((x) => x.filter((y) => y.id !== t.id)); cambio(); }} /> : null;
              })}
              <Button type="button" variant="outline" size="sm" onClick={() => setEligiendoEtiquetas(true)}>
                <Tags /> Etiquetas
              </Button>
            </div>
            <SelectorCategoria
              categorias={acciones.catalogo?.categorias ?? []}
              valor={categoriaId}
              onCambio={(id) => {
                setCategoriaId(id);
                cambio();
              }}
              onAdministrar={() => onAdministrar("categorias")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {fotos.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload */}
                <img src={url} alt="" className="size-20 rounded-lg object-cover" />
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => {
                    setFotos((x) => x.filter((u) => u !== url));
                    cambio();
                  }}
                  className="absolute -top-2 -right-2 rounded-full bg-background p-0.5 shadow"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {fotos.length < MAX_FOTOS && (
              <label className="flex size-20 cursor-pointer items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted">
                <ImagePlus aria-hidden />
                <span className="sr-only">Agregar foto</span>
                <input type="file" accept="image/*" multiple className="hidden" disabled={subiendo} onChange={(e) => void subirFotos(e.target.files)} />
              </label>
            )}
          </div>
        </div>
        {eligiendoEtiquetas && (
          <SelectorEtiquetas
            acciones={acciones}
            puestas={etiquetas}
            onCambio={(p) => {
              setEtiquetas(p);
              cambio();
            }}
            onAdministrar={() => onAdministrar("etiquetas")}
            onCerrar={() => setEligiendoEtiquetas(false)}
          />
        )}
        <SheetFooter className="flex-row items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {estado === "guardando" ? "Guardando…" : estado === "guardado" ? "Guardado" : ""}
          </span>
          <Button onClick={() => void cerrar()} disabled={subiendo}>
            Listo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
