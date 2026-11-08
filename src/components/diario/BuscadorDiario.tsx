"use client";
// Diario (lane 285): pantalla de búsqueda. Portado de vendor/moodiary/…/presentation/search/search_page.dart y …/application/search_controller.dart (ZhuJHua/moodiary@2c552dd):
// espera de 400 ms al escribir, historial de 12, total y tiempo, «ver más» de 30 en 30 y descarte de respuestas viejas; de vendor/storypad/lib/views/search/ (theachoem/storypad@a76825e):
// filtros (hoja aparte), último filtro recordado; de vendor/Daily_You/lib/providers/entries_provider.dart (Demizo/Daily_You@7cc237d): orden por fecha, ánimo o contador, con sentido.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownWideNarrow, ArrowLeft, ArrowUpNarrowWide, History, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  ESPERA_MS,
  FILTRO_VACIO,
  MAX_CANDIDATAS,
  PAGINA,
  agregarHistorial,
  aParametros,
  filtrosActivos,
  hayBusqueda,
  leerFiltro,
  leerHistorial,
  quitarHistorial,
  type FiltroBusqueda,
  type Orden,
} from "@/lib/diario/busqueda";
import type { Marcas, TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import type { HallazgoVista, ResultadoBusqueda } from "@/lib/diario/servidor-busqueda";
import { toast } from "@/lib/toast";
import { FiltrosBusqueda } from "./FiltrosBusqueda";
import type { AccionesCatalogo } from "./etiquetas/useCatalogo";
import { cambiarMarcasRemoto } from "./MarcasEntrada";
import { TarjetaHallazgo } from "./TarjetaHallazgo";

type Respuesta = { clave: string; datos: ResultadoBusqueda; extra: HallazgoVista[] };

const leerAlmacen = (k: string): string | null => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const escribirAlmacen = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* sin almacenamiento: la búsqueda funciona igual, solo no recuerda */
  }
};

const ETIQUETA_SENTIDO: Record<Orden, [string, string]> = {
  relevancia: ["", ""],
  fecha: ["Más nuevas primero", "Más viejas primero"],
  animo: ["Mejor ánimo primero", "Peor ánimo primero"],
  contador: ["Mayor valor primero", "Menor valor primero"],
};

export function BuscadorDiario({
  tipo,
  hoy,
  usuarioId,
  acciones,
  onVolver,
  onIrADia,
  onEditar,
  onCambio,
  version,
}: {
  tipo: TipoDiario;
  hoy: string;
  usuarioId: number;
  acciones: AccionesCatalogo;
  onVolver: () => void;
  /** Lleva al día de la entrada en el diario. */
  onIrADia: (fecha: string) => void;
  onEditar: (e: EntradaVista) => void;
  /** Se cambió algo (una marca): la lista del diario tiene que recargarse. */
  onCambio: () => void;
  /** Sube cuando se guardó una entrada en el editor: los resultados se piden de nuevo. */
  version: number;
}) {
  const claveHistorial = `ordo-diario-historial-${tipo}-${usuarioId}`;
  const claveFiltro = `ordo-diario-filtro-${tipo}-${usuarioId}`;

  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<FiltroBusqueda>(() => {
    const guardado = leerAlmacen(claveFiltro);
    if (!guardado) return FILTRO_VACIO;
    try {
      return { ...leerFiltro(new URLSearchParams(guardado)), consulta: "", desplazamiento: 0, limite: PAGINA };
    } catch {
      return FILTRO_VACIO;
    }
  });
  const [historial, setHistorial] = useState<string[]>(() => {
    try {
      return leerHistorial(JSON.parse(leerAlmacen(claveHistorial) ?? "[]"));
    } catch {
      return [];
    }
  });
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const ordenManual = useRef(false);

  const contadores = useMemo(() => acciones.catalogo?.etiquetas.filter((e) => e.tipo === "contador") ?? [], [acciones.catalogo]);

  // Espera de 400 ms desde la última tecla (moodiary)
  useEffect(() => {
    const t = window.setTimeout(() => {
      const q = texto.replace(/\s+/g, " ").trim();
      setFiltro((f) => (f.consulta === q ? f : { ...f, consulta: q, ...(ordenManual.current ? {} : { orden: q ? ("relevancia" as const) : ("fecha" as const) }) }));
    }, ESPERA_MS);
    return () => window.clearTimeout(t);
  }, [texto]);

  // Se recuerda el último filtro, sin el texto (storypad `search_filter_storage`)
  useEffect(() => {
    escribirAlmacen(claveFiltro, aParametros({ ...filtro, consulta: "", desplazamiento: 0 }, tipo).toString());
  }, [filtro, claveFiltro, tipo]);

  const params = useMemo(() => aParametros({ ...filtro, desplazamiento: 0 }, tipo).toString(), [filtro, tipo]);
  const activo = hayBusqueda(filtro);

  useEffect(() => {
    if (!activo) return;
    let vivo = true; // una respuesta vieja no pisa a la nueva (moodiary `_seq`)
    fetch(`/api/diario/buscar?${params}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudo buscar");
        if (vivo) setRespuesta({ clave: params, datos: d as ResultadoBusqueda, extra: [] });
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo buscar"));
    return () => {
      vivo = false;
    };
  }, [params, activo, version]);

  const guardarHistorial = useCallback(
    (lista: string[]) => {
      setHistorial(lista);
      escribirAlmacen(claveHistorial, JSON.stringify(lista));
    },
    [claveHistorial],
  );
  const recordar = (q: string) => guardarHistorial(agregarHistorial(historial, q));

  const vigente = respuesta && respuesta.clave === params ? respuesta : null;
  const buscando = activo && !vigente;
  const mostrada = activo ? respuesta : null;
  const hallazgos = mostrada ? [...mostrada.datos.hallazgos, ...mostrada.extra] : [];
  const hayMas = !!mostrada && hallazgos.length < mostrada.datos.total;
  const conteoEtiquetas = useMemo(() => new Map((mostrada?.datos.etiquetas ?? []).map((x) => [x.id, x.n])), [mostrada]);

  async function verMas() {
    if (!mostrada || cargandoMas) return;
    const clave = mostrada.clave;
    setCargandoMas(true);
    try {
      const r = await fetch(`/api/diario/buscar?${aParametros({ ...filtro, desplazamiento: hallazgos.length }, tipo)}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "No se pudo cargar más");
      setRespuesta((x) => (x && x.clave === clave ? { ...x, extra: [...x.extra, ...(d as ResultadoBusqueda).hallazgos] } : x));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar más");
    } finally {
      setCargandoMas(false);
    }
  }

  async function marcar(id: number, marcas: Marcas) {
    if (!(await cambiarMarcasRemoto(id, marcas))) return;
    const parchar = (hs: HallazgoVista[]) => hs.map((h) => (h.entrada.id === id ? { ...h, entrada: { ...h.entrada, ...marcas } } : h));
    setRespuesta((r) => (r ? { ...r, datos: { ...r.datos, hallazgos: parchar(r.datos.hallazgos) }, extra: parchar(r.extra) } : r));
    onCambio();
  }

  const cambiar = (c: Partial<FiltroBusqueda>) => setFiltro((f) => ({ ...f, ...c }));
  const ordenVisible: Orden = filtro.orden === "relevancia" && !filtro.consulta ? "fecha" : filtro.orden;
  const nFiltros = filtrosActivos(filtro);

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          recordar(texto);
        }}
      >
        <Button type="button" variant="ghost" size="icon" aria-label="Volver al diario" onClick={onVolver}>
          <ArrowLeft />
        </Button>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input autoFocus type="search" aria-label="Buscar en el diario" placeholder="Buscar en el diario" className="pl-8" value={texto} maxLength={200} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <Button type="button" variant="outline" onClick={() => setFiltrosAbiertos(true)}>
          <SlidersHorizontal /> Filtros
          {nFiltros > 0 && <Badge className="ml-1">{nFiltros}</Badge>}
        </Button>
      </form>

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
        {nFiltros > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => cambiar({ ...FILTRO_VACIO, consulta: filtro.consulta, orden: filtro.orden, sentido: filtro.sentido, contadorId: filtro.contadorId })}>
            Quitar filtros
          </Button>
        )}
      </div>

      {!activo && (
        <div className="flex flex-col gap-3">
          {historial.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <History className="size-4" aria-hidden /> Búsquedas recientes
                </h2>
                <button type="button" className="text-sm text-primary" onClick={() => guardarHistorial([])}>
                  Borrar historial
                </button>
              </div>
              <ul className="flex flex-wrap gap-2">
                {historial.map((q) => (
                  <li key={q} className="inline-flex items-center rounded-full border bg-card">
                    <button type="button" className="max-w-56 truncate py-1 pr-1 pl-3 text-sm" onClick={() => setTexto(q)}>
                      {q}
                    </button>
                    <button type="button" aria-label={`Quitar «${q}» del historial`} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground" onClick={() => guardarHistorial(quitarHistorial(historial, q))}>
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Escribí algo para buscar, o abrí los filtros para listar por etiqueta, categoría, fecha o ánimo.</p>
          )}
        </div>
      )}

      {activo && (
        <div className={buscando ? "opacity-60 transition-opacity" : undefined} aria-busy={buscando}>
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {buscando && !mostrada
              ? "Buscando…"
              : mostrada
                ? `${mostrada.datos.total} ${mostrada.datos.total === 1 ? "entrada" : "entradas"} · ${mostrada.datos.milisegundos} ms${buscando ? " · actualizando…" : ""}`
                : ""}
          </p>
          {mostrada?.datos.truncado && (
            <p className="mb-3 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
              Se compararon las {MAX_CANDIDATAS.toLocaleString("es-UY")} entradas más recientes. Para buscar en las más viejas, acotá las fechas en Filtros.
            </p>
          )}
          {mostrada && hallazgos.length === 0 && !buscando && <p className="py-8 text-center text-sm text-muted-foreground">No hay entradas que coincidan.</p>}
          <div className="flex flex-col gap-3">
            {hallazgos.map((h) => (
              <TarjetaHallazgo
                key={h.entrada.id}
                h={h}
                tipo={tipo}
                catalogo={acciones.catalogo}
                onAbrir={() => {
                  recordar(filtro.consulta);
                  onIrADia(h.entrada.fecha);
                }}
                onEditar={() => onEditar(h.entrada)}
                onMarcar={(m) => void marcar(h.entrada.id, m)}
              />
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
      )}

      <FiltrosBusqueda
        abierto={filtrosAbiertos}
        filtro={filtro}
        onFiltro={cambiar}
        onLimpiar={() => cambiar({ ...FILTRO_VACIO, consulta: filtro.consulta, orden: filtro.orden, sentido: filtro.sentido, contadorId: filtro.contadorId })}
        onCerrar={() => setFiltrosAbiertos(false)}
        catalogo={acciones.catalogo}
        conteoEtiquetas={conteoEtiquetas}
        anios={mostrada?.datos.anios ?? []}
        hoy={hoy}
      />
    </div>
  );
}
