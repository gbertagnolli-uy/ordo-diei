"use client";
// Diario (lane 295): el grafo local de una entrada: lo que ella enlaza a la derecha, lo que la enlaza a la izquierda, los mutuos arriba. Se puede centrar en
// otra entrada del grafo y volver atrás por la pila de centros. El selector de saltos (1–3) es un agregado de esta app (decisión G7).
// Portado de vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/graph/diary_ego_graph_page.dart (ZhuJHua/moodiary@2c552dd).
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GRAFO_VACIO,
  PROFUNDIDAD_MAX,
  PROFUNDIDAD_MIN,
  rotuloDeNodo,
  type DatosGrafo,
} from "@/lib/diario/grafo";
import { colorCss } from "@/lib/diario/grafo-color";
import {
  AJUSTES_GRAFO as A,
  construirEscena,
  direccionesDesdeCentro,
  disposicionRadial,
  gradosDirigidos,
  gravedad,
  longitudResorte,
  radioColision,
  repulsion,
} from "@/lib/diario/grafo-escena";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Segmentos } from "../estadisticas/controles";
import { GrafoCanvas, type ControlGrafo } from "./GrafoCanvas";
import { MarcoGrafo } from "./marco";
import { animarPosiciones, correrFuerzas } from "./motor";
import { coloresDeNodos, usePaleta } from "./paleta";
import { TarjetaNodo } from "./TarjetaNodo";

const OPCIONES_SALTOS = Array.from({ length: PROFUNDIDAD_MAX - PROFUNDIDAD_MIN + 1 }, (_, i) => ({ valor: String(PROFUNDIDAD_MIN + i), titulo: `${PROFUNDIDAD_MIN + i}` }));

async function pedirGrafoLocal(tipo: TipoDiario, id: number, profundidad: number): Promise<DatosGrafo> {
  const r = await fetch(`/api/diario/grafo/${id}?tipo=${tipo}&profundidad=${profundidad}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "No se pudo cargar el grafo");
  return d as DatosGrafo;
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-muted/85 px-2.5 text-xs text-muted-foreground">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {texto}
    </span>
  );
}

export function GrafoLocal({
  tipo,
  centroInicial,
  catalogo,
  version,
  onSalir,
  onIrADia,
}: {
  tipo: TipoDiario;
  centroInicial: number;
  catalogo: Catalogo | null;
  version: number;
  /** Se salió del grafo (con la pila de centros vacía). */
  onSalir: () => void;
  onIrADia: (fecha: string) => void;
}) {
  const [centros, setCentros] = useState<number[]>([centroInicial]);
  const [saltos, setSaltos] = useState(1);
  const centro = centros[centros.length - 1];
  const [cargado, setCargado] = useState<{ clave: string; datos: DatosGrafo } | null>(null);
  const [elegido, setElegido] = useState<number | null>(null);
  const [movido, setMovido] = useState(false);
  const [marco] = useState(() => new MarcoGrafo());
  const control = useRef<ControlGrafo>(null);
  const paleta = usePaleta();

  const clave = `${tipo}|${centro}|${saltos}|${version}`;
  useEffect(() => {
    let vivo = true;
    pedirGrafoLocal(tipo, centro, saltos)
      .then((datos) => {
        if (vivo) setCargado({ clave, datos });
      })
      .catch((e) => {
        if (!vivo) return;
        setCargado({ clave, datos: GRAFO_VACIO });
        toast.error(e instanceof Error ? e.message : "No se pudo cargar el grafo");
      });
    return () => {
      vivo = false;
    };
  }, [tipo, centro, saltos, clave]);

  // Mientras llega el grafo del centro nuevo se sigue viendo el anterior, apagado
  const datos = cargado?.datos ?? GRAFO_VACIO;
  const cargando = cargado?.clave !== clave;
  const escena = useMemo(() => construirEscena(datos), [datos]);
  const radial = useMemo(() => disposicionRadial(escena), [escena]);
  const direcciones = useMemo(() => direccionesDesdeCentro(escena), [escena]);
  const rotulos = useMemo(() => datos.nodos.map(rotuloDeNodo), [datos]);
  const colores = useMemo(() => (paleta ? coloresDeNodos(datos, "categoria", catalogo, paleta) : []), [datos, catalogo, paleta]);

  // moodiary: se parte de la disposición radial, el motor de fuerzas afina con el centro fijo y se pasa de una a otra con una animación de 850 ms
  useEffect(() => {
    const n = escena.datos.nodos.length;
    if (n <= 1) {
      marco.empujar(radial.posiciones, true);
      return;
    }
    marco.empujar(radial.posiciones);
    let cancelarAnimacion = () => {};
    const cancelarMotor = correrFuerzas({
      n,
      aristas: escena.aristasNoDirigidas,
      semilla: radial.posiciones,
      marco,
      mostrarCuadros: false,
      params: {
        iteraciones: A.iteraciones,
        theta: A.theta,
        repulsion: repulsion("normal"),
        largoResorte: longitudResorte("normal"),
        fuerzaResorte: A.fuerzaResorte,
        gravedad: gravedad("normal"),
        radioColision: radioColision("normal"),
        decaimientoVelocidad: A.decaimientoVelocidad,
        emitirCada: A.iteraciones,
        alfaInicial: 1,
        pasoMinimo: A.pasoMinRazon,
        fijos: escena.centro === 0 ? 1 : 0,
        normalizarEscala: true,
      },
      alTerminar: (final) => {
        if (!final || final.length !== n * 2) {
          marco.marcarAsentado();
          return;
        }
        cancelarAnimacion = animarPosiciones(radial.posiciones, final, 850, marco);
      },
    });
    return () => {
      cancelarMotor();
      cancelarAnimacion();
    };
  }, [escena, radial, marco]);

  const centroIndice = escena.centro ?? 0;
  const indice = elegido === null ? -1 : datos.nodos.findIndex((n) => n.id === elegido);
  const seleccionado = indice >= 0 ? indice : null;
  const informado = seleccionado ?? centroIndice;
  const delCentro = gradosDirigidos(datos, centroIndice);
  const solo = !cargando && datos.nodos.length <= 1;

  function centrarEn(id: number) {
    setCentros((c) => [...c, id]);
    setElegido(null);
    setMovido(false);
  }

  function atras() {
    if (centros.length <= 1) return onSalir();
    setCentros((c) => c.slice(0, -1));
    setElegido(null);
    setMovido(false);
  }

  return (
    <section aria-label="Grafo local de la entrada" className="mx-auto flex w-full max-w-5xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label={centros.length > 1 ? "Volver al centro anterior" : "Volver"} onClick={atras}>
          <ArrowLeft />
        </Button>
        <h2 className="flex-1 text-lg font-semibold">Grafo local</h2>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          Saltos
          <Segmentos
            etiqueta="Saltos"
            opciones={OPCIONES_SALTOS}
            valor={String(saltos)}
            onCambio={(v) => {
              setSaltos(Number(v));
              setElegido(null);
            }}
          />
        </span>
      </div>
      <div className="relative h-[70vh] min-h-[22rem] overflow-hidden rounded-xl border bg-card">
        {cargado === null || (cargando && datos.nodos.length === 0) ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : solo || datos.nodos.length === 0 ? (
          <p className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">Esta entrada todavía no tiene enlaces.</p>
        ) : paleta ? (
          <div className={cn("absolute inset-0 transition-opacity", cargando && "opacity-40")}>
            <GrafoCanvas
              className="absolute inset-0"
              control={control}
              descripcion={`Grafo local de ${datos.nodos.length} entradas. Con las flechas del teclado se recorren las entradas.`}
              escena={escena}
              marco={marco}
              paleta={paleta}
              colores={colores}
              rotulos={rotulos}
              seleccionado={seleccionado}
              etiquetas
              direcciones={direcciones}
              extension={radial.radioExterior}
              alSeleccionar={(i) => setElegido(i === null ? null : datos.nodos[i].id)}
              alMover={setMovido}
            />
            <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between">
              <Leyenda color={colorCss(paleta.entrante)} texto={`← ${delCentro.entrantes} ${delCentro.entrantes === 1 ? "entrante" : "entrantes"}`} />
              <Leyenda color={colorCss(paleta.saliente)} texto={`${delCentro.salientes} ${delCentro.salientes === 1 ? "saliente" : "salientes"} →`} />
            </div>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Volver al centro"
              title="Volver al centro"
              className={cn("absolute right-3 bottom-20 rounded-full shadow transition-transform", movido ? "scale-100" : "pointer-events-none scale-0")}
              onClick={() => control.current?.encajar()}
            >
              <Focus />
            </Button>
            <div className="absolute inset-x-3 bottom-3">
              <TarjetaNodo
                key={datos.nodos[informado].id}
                nodo={datos.nodos[informado]}
                color={colores[informado] ?? paleta.base}
                {...gradosDirigidos(datos, informado)}
                onAbrir={() => onIrADia(datos.nodos[informado].fecha)}
                onCentrar={informado === centroIndice ? undefined : () => centrarEn(datos.nodos[informado].id)}
                onCerrar={seleccionado === null ? undefined : () => setElegido(null)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
