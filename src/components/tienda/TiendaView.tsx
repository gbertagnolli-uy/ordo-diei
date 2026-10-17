"use client";

// Pantalla «Tienda» (SPEC §9): saldos fijos → oferta del día → meta de ahorro → chips de categoría →
// fila de destacados → catálogo en grilla. Todo se canjea con monedas del juego, nada con dinero real.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, Layers, LayoutGrid, Settings2, ShoppingCart, Sparkles, Ticket } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ModalAperturaSobre, type ResultadoCompraSobre } from "@/components/cartas/ModalAperturaSobre";
import { toast } from "@/lib/toast";
import type { ProductoVista, ResultadoCompra, TiendaVista } from "@/lib/tienda/server";
import { DetalleProducto } from "./DetalleProducto";
import { BarraSaldos, CompraExitosa, DialogoGanar, MetaAhorro, MisCompras, OfertaDelDia } from "./PartesTienda";
import { TarjetaProducto } from "./TarjetaProducto";

const CATEGORIAS = [
  { id: "todo", texto: "Todo", icono: LayoutGrid },
  { id: "cartas", texto: "Cartas", icono: Layers },
  { id: "premios", texto: "Premios", icono: Gift },
  { id: "vales", texto: "Vales", icono: Ticket },
] as const;

/** Orden del catálogo: primero lo que se puede comprar, luego lo que falta poco, al final lo apagado */
const RANGO: Record<ProductoVista["estado"], number> = { comprable: 0, sinSaldo: 1, bloqueado: 2, proximamente: 3, limite: 4, agotado: 5, oculto: 6 };

export function TiendaView({ inicial, esPadre, productoInicial }: { inicial: TiendaVista; esPadre: boolean; productoInicial?: number | null }) {
  const router = useRouter();
  const [tienda, setTienda] = useState(inicial);
  const [categoria, setCategoria] = useState<string>("todo");
  const [soloPuedo, setSoloPuedo] = useState(false);
  const [abierto, setAbierto] = useState<number | null>(productoInicial ?? null);
  const [ganarAbierto, setGanarAbierto] = useState(false);
  const [celebracion, setCelebracion] = useState<ResultadoCompra | null>(null);
  const [apertura, setApertura] = useState<ResultadoCompraSobre | null>(null);
  const [versionCompras, setVersionCompras] = useState(0);
  const ocupado = useRef(false);

  const refrescar = useCallback(async () => {
    if (ocupado.current) return;
    ocupado.current = true;
    try {
      const r = await fetch("/api/tienda", { cache: "no-store" });
      if (r.ok) setTienda(await r.json());
    } finally {
      ocupado.current = false;
    }
  }, []);

  // El saldo y el stock cambian solos (premios, otros hermanos): se actualizan al volver y cada 20 s
  useEffect(() => {
    const alVolver = () => document.visibilityState === "visible" && refrescar();
    document.addEventListener("visibilitychange", alVolver);
    const id = setInterval(alVolver, 20000);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      clearInterval(id);
    };
  }, [refrescar]);

  const { productos } = tienda;
  const abiertoProducto = useMemo(() => productos.find((p) => p.id === abierto) ?? null, [productos, abierto]);
  const meta = useMemo(() => productos.find((p) => p.esMeta) ?? null, [productos]);

  const visibles = useMemo(() => {
    return productos
      .filter((p) => (categoria === "todo" || p.categoria === categoria) && (!soloPuedo || p.estado === "comprable"))
      .sort((a, b) => RANGO[a.estado] - RANGO[b.estado] || Number(b.destacado) - Number(a.destacado));
  }, [productos, categoria, soloPuedo]);

  const destacados = useMemo(() => (categoria === "todo" && !soloPuedo ? visibles.filter((p) => p.destacado && p.estado === "comprable") : []), [visibles, categoria, soloPuedo]);
  const cuenta = (id: string) => (id === "todo" ? productos.length : productos.filter((p) => p.categoria === id).length);

  function alComprar(r: ResultadoCompra) {
    setAbierto(null);
    setTienda((t) => ({ ...t, saldos: r.saldos }));
    setVersionCompras((v) => v + 1);
    if (r.sobre) setApertura(r.sobre as unknown as ResultadoCompraSobre);
    else setCelebracion(r);
    refrescar();
  }

  function alComprarFragmentos(resultado: unknown) {
    setAbierto(null);
    setApertura(resultado as ResultadoCompraSobre);
    refrescar();
  }

  async function quitarMeta() {
    const r = await fetch("/api/tienda/meta", { method: "DELETE" });
    if (!r.ok) return toast.error("No se pudo quitar tu meta");
    refrescar();
  }

  const tarjeta = (p: ProductoVista, className?: string) => <TarjetaProducto key={p.id} p={p} onAbrir={(x) => setAbierto(x.id)} className={className} />;

  return (
    <div className="flex flex-col">
      <PageHeader group="Colección" title="Tienda">
        {esPadre && (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/dashboard/admin/tienda"><Settings2 className="size-4" /><span className="hidden sm:inline">Administrar tienda</span></Link>
          </Button>
        )}
      </PageHeader>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-28 sm:px-6">
        <BarraSaldos saldos={tienda.saldos} onGanar={() => setGanarAbierto(true)} />

        {tienda.ofertaDia && <OfertaDelDia oferta={tienda.ofertaDia} />}

        {meta && <MetaAhorro meta={meta} saldos={tienda.saldos} onAbrir={() => setAbierto(meta.id)} onQuitar={quitarMeta} />}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ToggleGroup type="single" value={categoria} onValueChange={(v) => v && setCategoria(v)} variant="outline" className="flex-wrap justify-start" aria-label="Categorías">
            {CATEGORIAS.map((c) => (
              <ToggleGroupItem key={c.id} value={c.id} className="h-11 gap-2 px-4 text-sm">
                <c.icono className="size-4" aria-hidden />
                {c.texto}
                <span className="text-xs text-muted-foreground tabular-nums">{cuenta(c.id)}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex items-center gap-2">
            <Switch id="solo-puedo" checked={soloPuedo} onCheckedChange={setSoloPuedo} />
            <Label htmlFor="solo-puedo" className="text-sm">Solo lo que puedo comprar</Label>
          </div>
        </div>

        {destacados.length > 0 && (
          <section aria-labelledby="titulo-destacados" className="flex flex-col gap-3">
            <h2 id="titulo-destacados" className="flex items-center gap-2 font-heading text-lg font-semibold"><Sparkles className="size-4 text-amber-500" />Destacados</h2>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
              {destacados.map((p) => tarjeta(p, "w-[44%] shrink-0 snap-start sm:w-56"))}
            </div>
          </section>
        )}

        <section aria-labelledby="titulo-catalogo" className="flex flex-col gap-3">
          <h2 id="titulo-catalogo" className="font-heading text-lg font-semibold">{categoria === "todo" ? "Todo el catálogo" : CATEGORIAS.find((c) => c.id === categoria)?.texto}</h2>
          {visibles.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><ShoppingCart /></EmptyMedia>
                <EmptyTitle>{productos.length === 0 ? "La Tienda está vacía" : "No hay nada por acá"}</EmptyTitle>
                <EmptyDescription>
                  {productos.length === 0
                    ? esPadre ? "Agregá los primeros productos desde «Administrar tienda»." : "Pedile a tus padres que agreguen premios."
                    : soloPuedo ? "Por ahora no te alcanza para nada de esta categoría. ¡Seguí sumando monedas!" : "Probá con otra categoría."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{visibles.map((p) => tarjeta(p))}</div>
          )}
        </section>

        <section aria-labelledby="titulo-compras" className="flex flex-col gap-3">
          <h2 id="titulo-compras" className="font-heading text-lg font-semibold">Mis compras</h2>
          <MisCompras version={versionCompras} />
        </section>
      </main>

      <DetalleProducto
        p={abiertoProducto}
        saldos={tienda.saldos}
        onCerrar={() => setAbierto(null)}
        onComprado={alComprar}
        onCambioMeta={refrescar}
        onFragmentos={alComprarFragmentos}
      />
      <DialogoGanar abierto={ganarAbierto} onCambio={setGanarAbierto} />
      <CompraExitosa resultado={celebracion} onCerrar={() => setCelebracion(null)} />
      <ModalAperturaSobre
        open={!!apertura}
        onOpenChange={(a) => !a && setApertura(null)}
        resultado={apertura}
        onAbrirOtro={() => setApertura(null)}
        onVerColeccion={() => {
          setApertura(null);
          router.push("/dashboard/cartas");
        }}
      />
    </div>
  );
}
