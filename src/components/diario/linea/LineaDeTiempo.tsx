"use client";
// Diario (lane 289): línea de tiempo de todas las entradas, por mes, con el orden y la categoría a elección.
// Portado de vendor/moodiary/.../timeline_view.dart y timeline_controller.dart (ZhuJHua/moodiary@2c552dd: meses con su cantidad, carga por páginas)
// y de vendor/Daily_You/lib/pages/entry_timeline_page.dart (Demizo/Daily_You@7cc237d: orden ascendente o descendente).
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ORDENES_LINEA, SIN_CATEGORIA, aplanarLinea, construirLinea, esOrdenLinea, type OrdenLinea } from "@/lib/diario/linea";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import type { PaginaLinea } from "@/lib/diario/servidor-linea";
import { toast } from "@/lib/toast";
import { MESES, Segmentos, usePreferencia } from "../estadisticas/controles";
import { NodoLineaTiempo } from "./NodoLineaTiempo";

type Categoria = number | typeof SIN_CATEGORIA | null;

async function pedirPagina(tipo: TipoDiario, orden: OrdenLinea, categoria: Categoria, cursor: string | null): Promise<PaginaLinea> {
  const p = new URLSearchParams({ tipo, orden });
  if (categoria !== null) p.set("categoria", String(categoria));
  if (cursor) p.set("cursor", cursor);
  const r = await fetch(`/api/diario/linea?${p}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "No se pudo cargar la línea de tiempo");
  return d as PaginaLinea;
}

const VACIA: PaginaLinea = { items: [], siguiente: null, conteoMeses: {} };

/** Las páginas ya cargadas de un orden y una categoría. Se vuelve a montar (con `key`) al cambiar cualquiera de los dos o cuando se guarda una entrada. */
function Paginas({ tipo, orden, categoria, catalogo, onIrADia }: { tipo: TipoDiario; orden: OrdenLinea; categoria: Categoria; catalogo: Catalogo | null; onIrADia: (fecha: string) => void }) {
  const [pagina, setPagina] = useState<PaginaLinea>(VACIA);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    pedirPagina(tipo, orden, categoria, null)
      .then((p) => {
        if (!vivo) return;
        setPagina(p);
        setCargando(false);
      })
      .catch((e) => {
        if (!vivo) return;
        setCargando(false);
        toast.error(e instanceof Error ? e.message : "No se pudo cargar la línea de tiempo");
      });
    return () => {
      vivo = false;
    };
  }, [tipo, orden, categoria]);

  async function cargarMas() {
    if (!pagina.siguiente || cargando) return;
    setCargando(true);
    try {
      const p = await pedirPagina(tipo, orden, categoria, pagina.siguiente);
      setPagina((antes) => ({ items: [...antes.items, ...p.items], siguiente: p.siguiente, conteoMeses: { ...antes.conteoMeses, ...p.conteoMeses } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la línea de tiempo");
    } finally {
      setCargando(false);
    }
  }

  const meses = construirLinea(pagina.items);
  const plano = aplanarLinea(meses);
  const desde = meses.reduce<number[]>((acc, m, i) => [...acc, i === 0 ? 0 : acc[i - 1] + meses[i - 1].nodos.length], []);

  if (!pagina.items.length) return <p className="py-8 text-center text-sm text-muted-foreground">{cargando ? "Cargando…" : "No hay entradas para mostrar."}</p>;
  return (
    <div className="flex flex-col">
      {meses.map((m, mi) => {
        const [anio, mes] = m.mes.split("-").map(Number);
        const total = pagina.conteoMeses[m.mes];
        return (
          <section key={m.mes} aria-label={`${MESES[mes - 1]} de ${anio}`}>
            <h3 className="sticky top-0 z-10 flex items-baseline gap-2 bg-background/95 py-2 text-sm font-semibold backdrop-blur">
              <span className="capitalize">{MESES[mes - 1]}</span> <span className="font-normal text-muted-foreground">{anio}</span>
              {total !== undefined && <span className="ml-auto text-xs font-normal text-muted-foreground">{total === 1 ? "1 entrada" : `${total} entradas`}</span>}
            </h3>
            <ol className="flex flex-col">
              {m.nodos.map((n, i) => {
                const posicion = desde[mi] + i;
                return <NodoLineaTiempo key={n.item.entrada.id} nodo={n} siguiente={plano[posicion + 1] ?? null} ultimo={posicion === plano.length - 1 && !pagina.siguiente} catalogo={catalogo} porEdicion={orden === "edicion"} onAbrir={onIrADia} />;
              })}
            </ol>
          </section>
        );
      })}
      {pagina.siguiente && (
        <Button variant="outline" className="mx-auto mt-2" disabled={cargando} onClick={() => void cargarMas()}>
          {cargando ? "Cargando…" : "Cargar más"}
        </Button>
      )}
    </div>
  );
}

/** Las categorías como lista plana, con el camino completo («Fe › Misa»), para el selector. */
export function opcionesDeCategoria(catalogo: Catalogo | null): { id: number; nombre: string }[] {
  if (!catalogo) return [];
  const camino = (id: number): string => {
    const nombres: string[] = [];
    for (let c = catalogo.categorias.find((x) => x.id === id); c && nombres.length < 5; c = c.padreId != null ? catalogo.categorias.find((x) => x.id === c!.padreId) : undefined) nombres.unshift(c.nombre);
    return nombres.join(" › ");
  };
  return catalogo.categorias.map((c) => ({ id: c.id, nombre: camino(c.id) })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function LineaDeTiempo({
  tipo,
  catalogo,
  version,
  onVolver,
  onIrADia,
}: {
  tipo: TipoDiario;
  catalogo: Catalogo | null;
  /** Sube cuando se guardó o borró una entrada, para volver a pedir las páginas. */
  version: number;
  onVolver: () => void;
  onIrADia: (fecha: string) => void;
}) {
  const [orden, setOrden] = usePreferencia<OrdenLinea>(`diario.linea.${tipo}`, "fecha-desc", esOrdenLinea);
  const [categoria, setCategoria] = useState<Categoria>(null);
  const categorias = opcionesDeCategoria(catalogo);
  // Una categoría que ya no existe deja de filtrar
  const filtro: Categoria = typeof categoria === "number" && !categorias.some((c) => c.id === categoria) ? null : categoria;

  return (
    <section aria-label="Línea de tiempo del diario" className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Volver" onClick={onVolver}>
          <ArrowLeft />
        </Button>
        <h2 className="flex-1 text-lg font-semibold">Línea de tiempo</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmentos etiqueta="Orden" opciones={ORDENES_LINEA} valor={orden} onCambio={setOrden} />
        {categorias.length > 0 && (
          <NativeSelect
            aria-label="Categoría"
            value={filtro === null ? "" : String(filtro)}
            onChange={(ev) => setCategoria(ev.target.value === "" ? null : ev.target.value === SIN_CATEGORIA ? SIN_CATEGORIA : Number(ev.target.value))}
          >
            <option value="">Todas las categorías</option>
            <option value={SIN_CATEGORIA}>Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </NativeSelect>
        )}
      </div>
      <Paginas key={`${orden}|${String(filtro)}|${version}`} tipo={tipo} orden={orden} categoria={filtro} catalogo={catalogo} onIrADia={onIrADia} />
    </section>
  );
}
