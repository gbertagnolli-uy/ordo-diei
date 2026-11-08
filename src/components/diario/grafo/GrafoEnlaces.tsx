"use client";
// Diario (lane 295): el grafo de todas las entradas que tienen enlaces, con filtro por categoría, período, densidad y color.
// Portado de vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/graph/diary_graph_page.dart (ZhuJHua/moodiary@2c552dd).
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FilterX, Focus, SlidersHorizontal, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OPCIONES_GRAFO,
  cantidadAristas,
  esOpcionesGrafo,
  estaVacio,
  filtrarGrafo,
  rangoDePeriodo,
  rotuloDeNodo,
  GRAFO_VACIO,
  MAX_ARISTAS_GRAFO,
  type DatosGrafo,
} from "@/lib/diario/grafo";
import { AJUSTES_GRAFO as A, construirEscena, gradosDirigidos, gravedad, longitudResorte, radioColision, repulsion, sembrarPorCapas } from "@/lib/diario/grafo-escena";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { usePreferencia } from "../estadisticas/controles";
import { GrafoCanvas, type ControlGrafo } from "./GrafoCanvas";
import { MarcoGrafo } from "./marco";
import { correrFuerzas } from "./motor";
import { OpcionesDelGrafo } from "./OpcionesGrafo";
import { coloresDeNodos, usePaleta } from "./paleta";
import { TarjetaNodo } from "./TarjetaNodo";
import { colorDeCategoria, colorCss } from "@/lib/diario/grafo-color";

async function pedirGrafo(tipo: TipoDiario): Promise<DatosGrafo> {
  const r = await fetch(`/api/diario/grafo?tipo=${tipo}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "No se pudo cargar el grafo");
  return d as DatosGrafo;
}

/** moodiary `GraphEmptyState`: nada enlazado todavía. */
function SinEnlaces({ onEscribir }: { onEscribir: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Waypoints className="size-16 text-muted-foreground/50" aria-hidden />
      <h3 className="text-base font-semibold">Todavía no hay enlaces</h3>
      <p className="max-w-sm text-sm text-muted-foreground">Cuando una entrada enlace a otra, las dos aparecen acá. Escribí «[[» en una entrada para enlazar otra.</p>
      <Button variant="secondary" onClick={onEscribir}>
        Escribir una entrada
      </Button>
    </div>
  );
}

export function GrafoEnlaces({
  tipo,
  hoy,
  catalogo,
  version,
  onVolver,
  onIrADia,
  onCentrar,
  onEscribir,
}: {
  tipo: TipoDiario;
  hoy: string;
  catalogo: Catalogo | null;
  /** Sube cuando se guardó o borró una entrada, para volver a pedir el grafo. */
  version: number;
  onVolver: () => void;
  onIrADia: (fecha: string) => void;
  /** Abre el grafo local de la entrada. */
  onCentrar: (id: number) => void;
  onEscribir: () => void;
}) {
  const [completo, setCompleto] = useState<DatosGrafo | null>(null);
  const [opciones, setOpciones] = usePreferencia(`diario.grafo.${tipo}`, OPCIONES_GRAFO, esOpcionesGrafo);
  const [categoria, setCategoria] = useState<number | null>(null);
  const [elegido, setElegido] = useState<number | null>(null);
  const [movido, setMovido] = useState(false);
  const [verOpciones, setVerOpciones] = useState(false);
  const [marco] = useState(() => new MarcoGrafo());
  const control = useRef<ControlGrafo>(null);
  const memoria = useRef(new Map<number, [number, number]>());
  const densidadPrevia = useRef(opciones.densidad);
  const paleta = usePaleta();

  useEffect(() => {
    let vivo = true;
    pedirGrafo(tipo)
      .then((d) => {
        if (vivo) setCompleto(d);
      })
      .catch((e) => {
        if (!vivo) return;
        setCompleto((antes) => antes ?? GRAFO_VACIO);
        toast.error(e instanceof Error ? e.message : "No se pudo cargar el grafo");
      });
    return () => {
      vivo = false;
    };
  }, [tipo, version]);

  // Una categoría que ya no existe deja de filtrar
  const categorias = useMemo(() => [...(catalogo?.categorias ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")), [catalogo]);
  const filtro = categoria !== null && categorias.some((c) => c.id === categoria) ? categoria : null;
  const rango = useMemo(() => rangoDePeriodo(opciones.periodo, hoy), [opciones.periodo, hoy]);
  const datos = useMemo(() => (completo ? filtrarGrafo(completo, { categoriaId: filtro, rango }) : GRAFO_VACIO), [completo, filtro, rango]);
  const escena = useMemo(() => construirEscena(datos), [datos]);
  const rotulos = useMemo(() => datos.nodos.map(rotuloDeNodo), [datos]);
  const colores = useMemo(() => (paleta ? coloresDeNodos(datos, opciones.color, catalogo, paleta) : []), [datos, opciones.color, catalogo, paleta]);

  // El motor de fuerzas: arranca de las posiciones que ya tenía cada nodo (si son la mayoría, con menos energía) o de la siembra por capas
  useEffect(() => {
    if (densidadPrevia.current !== opciones.densidad) {
      densidadPrevia.current = opciones.densidad;
      memoria.current.clear();
    }
    const n = escena.datos.nodos.length;
    if (!n) {
      marco.empujar(new Float32Array(0), true);
      return;
    }
    const resorte = longitudResorte(opciones.densidad);
    const semilla = sembrarPorCapas(escena, resorte);
    let reutilizados = 0;
    escena.datos.nodos.forEach((nodo, i) => {
      const p = memoria.current.get(nodo.id);
      if (!p) return;
      semilla[i * 2] = p[0];
      semilla[i * 2 + 1] = p[1];
      reutilizados++;
    });
    const iteraciones = n > A.nodosGrande ? A.iteracionesGrande : A.iteraciones;
    return correrFuerzas({
      n,
      aristas: escena.aristasNoDirigidas,
      semilla,
      marco,
      mostrarCuadros: true,
      params: {
        iteraciones,
        theta: A.theta,
        repulsion: repulsion(opciones.densidad),
        largoResorte: resorte,
        fuerzaResorte: A.fuerzaResorte,
        gravedad: gravedad(opciones.densidad),
        radioColision: radioColision(opciones.densidad),
        decaimientoVelocidad: A.decaimientoVelocidad,
        emitirCada: Math.min(64, Math.max(1, Math.ceil(iteraciones / A.cuadrosObjetivo))),
        alfaInicial: reutilizados > n * 0.6 ? A.alfaRefresco : 1,
        pasoMinimo: A.pasoMinRazon,
        fijos: 0,
        normalizarEscala: true,
      },
      alTerminar: (final) => {
        if (!final || final.length !== n * 2) return;
        escena.datos.nodos.forEach((nodo, i) => memoria.current.set(nodo.id, [final[i * 2], final[i * 2 + 1]]));
      },
    });
  }, [escena, opciones.densidad, marco]);

  const indice = elegido === null ? -1 : datos.nodos.findIndex((n) => n.id === elegido);
  const seleccionado = indice >= 0 ? indice : null;
  const enlaces = cantidadAristas(datos);
  const hayFiltro = filtro !== null || opciones.periodo !== "todo";

  function limpiarFiltros() {
    setCategoria(null);
    setOpciones({ ...opciones, periodo: "todo" });
  }

  return (
    <section aria-label="Grafo de enlaces del diario" className="mx-auto flex w-full max-w-5xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Volver" onClick={onVolver}>
          <ArrowLeft />
        </Button>
        <h2 className="flex-1 text-lg font-semibold">Grafo de enlaces</h2>
        <Button variant="outline" size="sm" onClick={() => setVerOpciones(true)}>
          <SlidersHorizontal /> Vista
        </Button>
      </div>

      {completo === null ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : estaVacio(completo) ? (
        <SinEnlaces onEscribir={onEscribir} />
      ) : (
        <>
          <div role="group" aria-label="Categoría" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <ChipCategoria activo={filtro === null} onClick={() => setCategoria(null)}>
              Todas
            </ChipCategoria>
            {categorias.map((c) => (
              <ChipCategoria key={c.id} activo={filtro === c.id} color={colorCss(colorDeCategoria(c.color, c.id))} onClick={() => setCategoria(c.id)}>
                {c.nombre}
              </ChipCategoria>
            ))}
          </div>
          <div className="relative h-[70vh] min-h-[22rem] overflow-hidden rounded-xl border bg-card">
            {estaVacio(datos) ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <FilterX className="size-10 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">No hay entradas enlazadas con ese filtro.</p>
                {hayFiltro && (
                  <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                    Quitar filtros
                  </Button>
                )}
              </div>
            ) : paleta ? (
              <>
                <GrafoCanvas
                  className="absolute inset-0"
                  control={control}
                  descripcion={`Grafo de ${datos.nodos.length} entradas y ${enlaces} enlaces. Con las flechas del teclado se recorren las entradas.`}
                  escena={escena}
                  marco={marco}
                  paleta={paleta}
                  colores={colores}
                  rotulos={rotulos}
                  seleccionado={seleccionado}
                  etiquetas={opciones.etiquetas}
                  direcciones={null}
                  extension={null}
                  alSeleccionar={(i) => setElegido(i === null ? null : datos.nodos[i].id)}
                  alMover={setMovido}
                />
                <p className={cn("pointer-events-none absolute bottom-3 left-4 text-xs text-muted-foreground transition-opacity", seleccionado !== null && "opacity-0")}>
                  {datos.nodos.length} {datos.nodos.length === 1 ? "entrada" : "entradas"} · {enlaces} {enlaces === 1 ? "enlace" : "enlaces"}
                </p>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Volver a encajar el grafo"
                  title="Volver a encajar el grafo"
                  className={cn("absolute right-3 bottom-3 rounded-full shadow transition-transform", seleccionado !== null && "bottom-20", movido ? "scale-100" : "pointer-events-none scale-0")}
                  onClick={() => control.current?.encajar()}
                >
                  <Focus />
                </Button>
                {seleccionado !== null && (
                  <div className="absolute inset-x-3 bottom-3">
                    <TarjetaNodo
                      nodo={datos.nodos[seleccionado]}
                      color={colores[seleccionado] ?? paleta.base}
                      {...gradosDirigidos(datos, seleccionado)}
                      onAbrir={() => onIrADia(datos.nodos[seleccionado].fecha)}
                      onCentrar={() => onCentrar(datos.nodos[seleccionado].id)}
                      onCerrar={() => setElegido(null)}
                    />
                  </div>
                )}
              </>
            ) : null}
          </div>
          {completo.truncado && <p className="text-xs text-muted-foreground">Se muestran los {MAX_ARISTAS_GRAFO.toLocaleString("es-UY")} enlaces más recientes.</p>}
        </>
      )}
      {verOpciones && <OpcionesDelGrafo opciones={opciones} onCambiar={setOpciones} onCerrar={() => setVerOpciones(false)} />}
    </section>
  );
}

function ChipCategoria({ activo, color, onClick, children }: { activo: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition", activo ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
    >
      {color && <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
      {children}
    </button>
  );
}
