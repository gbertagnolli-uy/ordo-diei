"use client";
// Diario (lane 293): galería de entradas con fotos. Portado de vendor/Daily_You/lib/pages/gallery_page.dart (Demizo/Daily_You@7cc237d):
// búsqueda con espera, filtro por etiquetas (alguna / todas / sin), orden por fecha, ánimo o contador con sentido, tarjetas grandes (lista o con búsqueda)
// y chicas (grilla), «mostrar fotos», cuenta de resultados, botón de subir pasados 500 px y tocar una tarjeta abre la entrada.
// La búsqueda es la de la lane 285 con `fotos=si`; el diálogo de filtros es el mismo.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownWideNarrow, ArrowLeft, ArrowUp, ArrowUpNarrowWide, Eye, EyeOff, Images, LayoutGrid, List, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ESPERA_MS, aParametros, filtrosActivos, type FiltroBusqueda, type Orden } from "@/lib/diario/busqueda";
import { nivelDe, nombreDeNivel } from "@/lib/diario/escala";
import {
  FILTRO_GALERIA,
  OPCIONES_GALERIA,
  cuentaDeGaleria,
  esOpcionesGaleria,
  filtroDeGaleria,
  fotosDeEntrada,
  fotosDeTarjeta,
  mostrarSubir,
  tarjetaGrande,
} from "@/lib/diario/galeria";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { HallazgoVista, ResultadoBusqueda } from "@/lib/diario/servidor-busqueda";
import { toast } from "@/lib/toast";
import { usePreferencia } from "../estadisticas/controles";
import { GlifoAnimo, useEscala } from "../EscalaAnimo";
import type { AccionesCatalogo } from "../etiquetas/useCatalogo";
import { FiltrosBusqueda } from "../FiltrosBusqueda";
import { TextoResaltado } from "../TextoResaltado";

type Respuesta = { clave: string; datos: ResultadoBusqueda; extra: HallazgoVista[] };

const ETIQUETA_SENTIDO: Record<Orden, [string, string]> = {
  relevancia: ["", ""],
  fecha: ["Más nuevas primero", "Más viejas primero"],
  animo: ["Mejor ánimo primero", "Peor ánimo primero"],
  contador: ["Mayor valor primero", "Menor valor primero"],
};

const fechaCorta = (clave: string) => new Date(`${clave}T12:00:00`).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" });

function Foto({ url, className }: { url: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload
  return <img src={url} alt="" loading="lazy" className={className} />;
}

function TarjetaGaleria({ h, grande, mostrarFotos, onAbrir }: { h: HallazgoVista; grande: boolean; mostrarFotos: boolean; onAbrir: () => void }) {
  const e = h.entrada;
  const nivel = nivelDe(useEscala(), e.animo);
  const fotos = fotosDeTarjeta(fotosDeEntrada(e), grande, mostrarFotos);
  const animo = nivel ? (
    <span title={nombreDeNivel(nivel)} role="img" aria-label={`Ánimo: ${nombreDeNivel(nivel)}`}>
      <GlifoAnimo nivel={nivel} tamano={20} />
    </span>
  ) : null;

  if (!grande) {
    return (
      <button type="button" onClick={onAbrir} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        {fotos.portada ? <Foto url={fotos.portada} className="size-full object-cover transition-transform group-hover:scale-105" /> : <div className="grid size-full place-items-center p-3 text-xs text-muted-foreground">{e.titulo ?? e.texto.slice(0, 120)}</div>}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-white">
          <span className="min-w-0 flex-1 truncate text-xs font-medium">{fechaCorta(e.fecha)}</span>
          {animo && <span className="rounded-full bg-background/80 p-0.5">{animo}</span>}
        </div>
        {fotos.restantes > 0 && <Badge className="absolute top-1.5 right-1.5">+{fotos.restantes}</Badge>}
      </button>
    );
  }

  return (
    <button type="button" onClick={onAbrir} className="flex flex-col overflow-hidden rounded-xl border bg-card text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {fotos.portada && (
        <div className="relative aspect-[2/1] w-full bg-muted">
          <Foto url={fotos.portada} className="size-full object-cover" />
          {fotos.restantes > 0 && <Badge className="absolute top-2 right-2">+{fotos.restantes}</Badge>}
        </div>
      )}
      {fotos.miniaturas.length > 0 && (
        <div className="flex gap-1 px-2 pt-2">
          {fotos.miniaturas.map((url) => (
            <Foto key={url} url={url} className="size-16 rounded-md object-cover" />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">{fechaCorta(e.fecha)}</p>
          {animo}
        </div>
        {h.titulo && (
          <h3 className="font-semibold">
            <TextoResaltado segmentos={h.titulo} />
          </h3>
        )}
        {h.extracto.length > 0 && (
          <p className="line-clamp-3 text-sm">
            <TextoResaltado segmentos={h.extracto} />
          </p>
        )}
      </div>
    </button>
  );
}

export function GaleriaDiario({
  tipo,
  hoy,
  usuarioId,
  acciones,
  onVolver,
  onIrADia,
  version,
}: {
  tipo: TipoDiario;
  hoy: string;
  usuarioId: number;
  acciones: AccionesCatalogo;
  onVolver: () => void;
  /** Lleva al día de la entrada en el diario. */
  onIrADia: (fecha: string) => void;
  /** Sube cuando cambió algo en el diario: los resultados se piden de nuevo. */
  version: number;
}) {
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<FiltroBusqueda>(FILTRO_GALERIA);
  const [opciones, setOpciones] = usePreferencia(`diario.galeria.${tipo}.${usuarioId}`, OPCIONES_GALERIA, esOpcionesGaleria);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [lejos, setLejos] = useState(false);
  const ordenManual = useRef(false);

  const contadores = useMemo(() => acciones.catalogo?.etiquetas.filter((e) => e.tipo === "contador") ?? [], [acciones.catalogo]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const q = texto.replace(/\s+/g, " ").trim();
      setFiltro((f) => (f.consulta === q ? f : { ...f, consulta: q, ...(ordenManual.current ? {} : { orden: q ? ("relevancia" as const) : ("fecha" as const) }) }));
    }, ESPERA_MS);
    return () => window.clearTimeout(t);
  }, [texto]);

  useEffect(() => {
    const alDesplazar = () => setLejos(mostrarSubir(window.scrollY));
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  const params = useMemo(() => aParametros(filtroDeGaleria(filtro), tipo).toString(), [filtro, tipo]);

  useEffect(() => {
    let vivo = true; // una respuesta vieja no pisa a la nueva
    fetch(`/api/diario/buscar?${params}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudo cargar la galería");
        if (vivo) setRespuesta({ clave: params, datos: d as ResultadoBusqueda, extra: [] });
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo cargar la galería"));
    return () => {
      vivo = false;
    };
  }, [params, version]);

  const vigente = respuesta && respuesta.clave === params;
  const hallazgos = respuesta ? [...respuesta.datos.hallazgos, ...respuesta.extra] : [];
  const hayMas = !!respuesta && hallazgos.length < respuesta.datos.total;
  const conteoEtiquetas = useMemo(() => new Map((respuesta?.datos.etiquetas ?? []).map((x) => [x.id, x.n])), [respuesta]);
  const grande = tarjetaGrande(opciones, filtro.consulta);
  const nFiltros = filtrosActivos(filtro);
  const ordenVisible: Orden = filtro.orden === "relevancia" && !filtro.consulta ? "fecha" : filtro.orden;
  const cambiar = (c: Partial<FiltroBusqueda>) => setFiltro((f) => ({ ...f, ...c }));
  const limpiar = () => cambiar({ ...FILTRO_GALERIA, consulta: filtro.consulta, orden: filtro.orden, sentido: filtro.sentido, contadorId: filtro.contadorId });

  async function verMas() {
    if (!respuesta || cargandoMas) return;
    const clave = respuesta.clave;
    setCargandoMas(true);
    try {
      const r = await fetch(`/api/diario/buscar?${aParametros({ ...filtroDeGaleria(filtro), desplazamiento: hallazgos.length }, tipo)}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "No se pudo cargar más");
      setRespuesta((x) => (x && x.clave === clave ? { ...x, extra: [...x.extra, ...(d as ResultadoBusqueda).hallazgos] } : x));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar más");
    } finally {
      setCargandoMas(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Volver al diario" onClick={onVolver}>
          <ArrowLeft />
        </Button>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Images className="size-5" aria-hidden /> Galería
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" aria-label="Buscar en la galería" placeholder="Buscar en la galería" className="pl-8" value={texto} maxLength={200} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <Button type="button" variant="outline" onClick={() => setFiltrosAbiertos(true)}>
          <SlidersHorizontal /> Filtros
          {nFiltros > 0 && <Badge className="ml-1">{nFiltros}</Badge>}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          size="sm"
          aria-label="Ordenar por"
          value={ordenVisible}
          onChange={(e) => {
            ordenManual.current = true;
            const orden = e.target.value as Orden;
            cambiar({ orden, ...(orden === "contador" && filtro.contadorId === null && contadores[0] ? { contadorId: contadores[0].id } : {}) });
          }}
        >
          {filtro.consulta && <NativeSelectOption value="relevancia">Más relevantes</NativeSelectOption>}
          <NativeSelectOption value="fecha">Por fecha</NativeSelectOption>
          <NativeSelectOption value="animo">Por ánimo</NativeSelectOption>
          {contadores.length > 0 && <NativeSelectOption value="contador">Por contador</NativeSelectOption>}
        </NativeSelect>
        {ordenVisible === "contador" && (
          <NativeSelect size="sm" aria-label="Contador" value={filtro.contadorId ?? ""} onChange={(e) => cambiar({ contadorId: e.target.value ? Number(e.target.value) : null })}>
            {contadores.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.nombre}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
        {ordenVisible !== "relevancia" && (
          <Button type="button" variant="outline" size="sm" onClick={() => cambiar({ sentido: filtro.sentido === "desc" ? "asc" : "desc" })}>
            {filtro.sentido === "desc" ? <ArrowDownWideNarrow /> : <ArrowUpNarrowWide />}
            {ETIQUETA_SENTIDO[ordenVisible][filtro.sentido === "desc" ? 0 : 1]}
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" aria-pressed={opciones.modo === "lista"} onClick={() => setOpciones({ ...opciones, modo: opciones.modo === "grilla" ? "lista" : "grilla" })}>
          {opciones.modo === "grilla" ? <List /> : <LayoutGrid />}
          {opciones.modo === "grilla" ? "Ver en lista" : "Ver en grilla"}
        </Button>
        <Button type="button" variant="outline" size="sm" aria-pressed={opciones.mostrarFotos} onClick={() => setOpciones({ ...opciones, mostrarFotos: !opciones.mostrarFotos })}>
          {opciones.mostrarFotos ? <Eye /> : <EyeOff />}
          {opciones.mostrarFotos ? "Fotos visibles" : "Fotos ocultas"}
        </Button>
        {nFiltros > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={limpiar}>
            Quitar filtros
          </Button>
        )}
      </div>

      <div className={vigente ? undefined : "opacity-60 transition-opacity"} aria-busy={!vigente}>
        <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
          {!respuesta ? "Cargando…" : `${cuentaDeGaleria(respuesta.datos.total)}${vigente ? "" : " · actualizando…"}`}
        </p>
        {respuesta && hallazgos.length === 0 && vigente && (
          <p className="py-8 text-center text-sm text-muted-foreground">{filtro.consulta || nFiltros > 0 ? "No hay entradas con fotos que coincidan." : "Todavía no hay entradas con fotos."}</p>
        )}
        <div className={grande ? "flex flex-col gap-3" : "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"}>
          {hallazgos.map((h) => (
            <TarjetaGaleria key={h.entrada.id} h={h} grande={grande} mostrarFotos={opciones.mostrarFotos} onAbrir={() => onIrADia(h.entrada.fecha)} />
          ))}
        </div>
        {hayMas && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" disabled={cargandoMas} onClick={() => void verMas()}>
              {cargandoMas ? "Cargando…" : "Ver más"}
            </Button>
          </div>
        )}
      </div>

      {lejos && (
        <Button type="button" size="icon" variant="secondary" className="fixed right-4 bottom-36 z-30 rounded-full shadow-lg sm:right-6 sm:bottom-24" aria-label="Volver arriba" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp />
        </Button>
      )}

      <FiltrosBusqueda
        abierto={filtrosAbiertos}
        filtro={filtro}
        onFiltro={cambiar}
        onLimpiar={limpiar}
        onCerrar={() => setFiltrosAbiertos(false)}
        catalogo={acciones.catalogo}
        conteoEtiquetas={conteoEtiquetas}
        anios={respuesta?.datos.anios ?? []}
        hoy={hoy}
      />
    </div>
  );
}
