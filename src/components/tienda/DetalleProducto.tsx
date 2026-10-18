"use client";

// Detalle y compra de un producto en 2 pasos (SPEC §9.3–§9.4): elegir cómo pagar → confirmar con el saldo resultante.
import { useEffect, useRef, useState } from "react";
import { Check, Circle, Lock, ShieldCheck, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { Saldos } from "@/lib/tienda/monedas";
import { saldosTrasPagar } from "@/lib/tienda/precios";
import type { MiembroTiendaVista, ProductoVista, ResultadoCompra } from "@/lib/tienda/server";
import { ArteProducto } from "./ArteProducto";
import { FormularioCompraCompartida } from "./CompraCompartida";
import { FragmentosCartas } from "./FragmentosCartas";
import { MonedaIcono, Precio, textoFaltan } from "./Moneda";
import { MONEDAS } from "@/lib/tienda/monedas";

const NOMBRE_TIPO: Record<ProductoVista["tipo"], string> = { sobre: "Sobre de cartas", fragmentos: "Cartas", fisico: "Premio", vale: "Vale" };

function fechaLarga(iso: string) {
  return new Date(iso).toLocaleDateString("es-UY", { day: "numeric", month: "long" });
}

export function DetalleProducto({
  p,
  saldos,
  usuarioActual,
  familia,
  onCerrar,
  onComprado,
  onSolicitudCreada,
  onCambioMeta,
  onFragmentos,
}: {
  p: ProductoVista | null;
  saldos: Saldos;
  usuarioActual: { id: number; nombre: string; fotoUrl: string | null; saldos: Saldos };
  familia: MiembroTiendaVista[];
  onCerrar: () => void;
  onComprado: (r: ResultadoCompra) => void;
  onSolicitudCreada: () => void;
  onCambioMeta: () => void;
  onFragmentos: (r: unknown) => void;
}) {
  const [opcion, setOpcion] = useState(0);
  const [paso, setPaso] = useState<"detalle" | "confirmar" | "compartida">("detalle");
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clave = useRef<string>("");

  // Cada vez que se abre otro producto se vuelve al primer paso con la mejor opción elegida
  const id = p?.id;
  useEffect(() => {
    setOpcion(Math.max(0, p?.opcionSugerida ?? 0));
    setPaso("detalle");
    setError(null);
    setComprando(false);
    clave.current = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const elegida = p?.opciones[opcion];
  const comprable = p?.estado === "comprable" && !!elegida?.alcanza;
  const aptoCompartida =
    (p?.estado === "comprable" || p?.estado === "sinSaldo") &&
    p?.tipo !== "fragmentos" &&
    familia.length > 0;

  async function comprar() {
    if (!p || !elegida) return;
    if (!clave.current) clave.current = crypto.randomUUID();
    setComprando(true);
    setError(null);
    try {
      const res = await fetch("/api/tienda/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId: p.id, opcion, clave: clave.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo completar la compra");
      onComprado(data as ResultadoCompra);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la compra");
      setPaso("detalle");
      clave.current = "";
    } finally {
      setComprando(false);
    }
  }

  async function alternarMeta() {
    if (!p) return;
    const res = await fetch("/api/tienda/meta", {
      method: p.esMeta ? "DELETE" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: p.esMeta ? undefined : JSON.stringify({ productoId: p.id }),
    });
    if (!res.ok) return toast.error("No se pudo cambiar tu meta");
    toast.success(p.esMeta ? "Quitaste tu meta" : "¡Es tu nueva meta!", p.esMeta ? undefined : p.titulo);
    onCambioMeta();
  }

  const despues = elegida ? saldosTrasPagar(elegida, saldos) : saldos;
  const bloqueado = p?.estado === "bloqueado";

  return (
    <Sheet open={!!p} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <SheetContent side="bottom" className="mx-auto max-h-[92svh] gap-0 overflow-y-auto rounded-t-2xl p-0 sm:max-w-lg">
        {p && (
          <>
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-muted">
              <div className={cn("size-full", bloqueado && "grayscale")}><ArteProducto p={p} /></div>
              {bloqueado && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="flex size-16 items-center justify-center rounded-full bg-black/60 text-white"><Lock className="size-8" aria-hidden /></span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 p-5">
              <SheetHeader className="p-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{NOMBRE_TIPO[p.tipo]}</Badge>
                  {p.stockRestante !== null && <Badge variant={p.stockRestante <= 3 ? "destructive" : "outline"}>{p.stockRestante > 0 ? `Quedan ${p.stockRestante}` : "Agotado"}</Badge>}
                  {p.limite && <Badge variant="outline">Máx. {p.limite.max}{p.limite.periodo === "siempre" ? "" : ` por ${p.limite.periodo === "dia" ? "día" : p.limite.periodo}`}</Badge>}
                  {p.disponibleHasta && <Badge variant="outline">Hasta el {fechaLarga(p.disponibleHasta)}</Badge>}
                </div>
                <SheetTitle className="font-heading text-xl leading-tight">{p.titulo}</SheetTitle>
                <SheetDescription>{p.descripcion ?? (p.tipo === "vale" ? "Un vale para canjear con tus padres." : p.tipo === "fisico" ? "Tus padres te lo entregan." : "")}</SheetDescription>
              </SheetHeader>

              {p.tipo === "fragmentos" ? (
                <FragmentosCartas onResultado={onFragmentos} />
              ) : paso === "compartida" ? (
                <FormularioCompraCompartida
                  p={p}
                  opcion={opcion}
                  onCambiarOpcion={setOpcion}
                  usuarioActual={usuarioActual}
                  familia={familia}
                  onVolver={() => setPaso("detalle")}
                  onSolicitudCreada={() => {
                    onCerrar();
                    onSolicitudCreada();
                  }}
                />
              ) : (
                <>
                  {p.requisitos.length > 0 && (
                    <section aria-label="Para desbloquear" className="flex flex-col gap-2 rounded-xl border p-3">
                      <h4 className="flex items-center gap-1.5 text-sm font-semibold"><Lock className="size-3.5" />Para desbloquear</h4>
                      <ul className="flex flex-col gap-2">
                        {p.requisitos.map((r) => (
                          <li key={r.texto} className="flex flex-col gap-1">
                            <span className={cn("flex items-center gap-2 text-sm", r.cumplido ? "text-foreground" : "text-muted-foreground")}>
                              {r.cumplido ? <Check className="size-4 text-emerald-500" aria-label="Cumplido" /> : <Circle className="size-4" aria-label="Pendiente" />}
                              {r.texto}
                            </span>
                            {!r.cumplido && r.objetivo > 1 && (
                              <span className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">
                                <Progress value={(r.actual / r.objetivo) * 100} className="h-1.5 flex-1" />
                                <span className="tabular-nums">{r.actual}/{r.objetivo}</span>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section aria-label="Cómo pagar" className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold">{p.opciones.length > 1 ? "Elegí cómo pagar" : "Precio"}</h4>
                    <div role="radiogroup" className="flex flex-col gap-2">
                      {p.opciones.map((o, i) => (
                        <button
                          key={i}
                          type="button"
                          role="radio"
                          aria-checked={opcion === i}
                          disabled={p.opciones.length === 1}
                          onClick={() => setOpcion(i)}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition",
                            opcion === i ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                            p.opciones.length === 1 && "cursor-default"
                          )}
                        >
                          <Precio costos={o.costos} className="text-base" />
                          <span className={cn("text-xs", o.alcanza ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                            {o.alcanza ? "Te alcanza" : `Te faltan ${textoFaltan(o.faltan)}`}
                          </span>
                        </button>
                      ))}
                    </div>
                    {p.requiereAprobacion && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" />Tus padres lo aprueban antes de entregártelo. Si no lo aprueban, te devuelven las monedas.</p>
                    )}
                  </section>

                  {paso === "confirmar" && elegida && (
                    <section aria-live="polite" className="flex flex-col gap-2 rounded-xl border border-primary/40 bg-primary/5 p-4">
                      <h4 className="font-heading text-base font-semibold">¿Confirmás la compra?</h4>
                      <p className="flex flex-wrap items-center gap-2 text-sm">Vas a pagar <Precio costos={elegida.costos} className="text-base" /> por «{p.titulo}».</p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        Te van a quedar:
                        {elegida.costos.map((c) => (
                          <span key={c.moneda} className="inline-flex items-center gap-1 tabular-nums"><strong className="text-foreground">{despues[c.moneda]}</strong><MonedaIcono moneda={c.moneda} className="size-3.5" /><span className="sr-only">{MONEDAS[c.moneda].nombre}</span></span>
                        ))}
                      </p>
                    </section>
                  )}

                  {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
                </>
              )}
            </div>

            {p.tipo !== "fragmentos" && paso !== "compartida" && (
              <SheetFooter className="sticky bottom-0 flex-col gap-2 border-t bg-popover p-4 sm:flex-col">
                {paso === "detalle" ? (
                  <>
                    <Button size="lg" disabled={!comprable} onClick={() => setPaso("confirmar")} className="w-full">
                      {comprable ? "Comprar" : bloqueado ? "Bloqueado" : p.estado === "agotado" ? "Agotado" : p.estado === "limite" ? "Ya lo compraste" : p.estado === "proximamente" ? "Todavía no está a la venta" : elegida ? `Te faltan ${textoFaltan(elegida.faltan)}` : "No disponible"}
                    </Button>
                    {aptoCompartida && (
                      <Button variant="secondary" size="lg" onClick={() => setPaso("compartida")} className="w-full gap-2">
                        <Users className="size-4" />
                        Compra compartida
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={alternarMeta} className="gap-1.5">
                      <Star className={cn("size-4", p.esMeta && "fill-amber-500 text-amber-500")} />
                      {p.esMeta ? "Quitar de mi meta" : "Fijar como mi meta"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" disabled={comprando} onClick={comprar} className="w-full gap-2">
                      {comprando && <Spinner />}Sí, comprar
                    </Button>
                    <Button variant="outline" disabled={comprando} onClick={() => setPaso("detalle")} className="w-full">Volver</Button>
                  </>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
