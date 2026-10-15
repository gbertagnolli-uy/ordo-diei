"use client";

// Piezas de la pantalla de la Tienda: saldos, «ganar monedas», oferta del día, meta de ahorro,
// celebración de la compra e historial (SPEC §9; adaptado de las tiendas de juegos sin dinero real).
import { useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CalendarCheck, CheckCircle2, Clock, Gift, PartyPopper, Plus, Sprout, Target, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CLAVES_MONEDA, MONEDAS, type Saldos } from "@/lib/tienda/monedas";
import type { ProductoVista, ResultadoCompra, TiendaVista } from "@/lib/tienda/server";
import { ArteProducto } from "./ArteProducto";
import { MonedaIcono, Precio } from "./Moneda";

// ─── Saldos ────────────────────────────────────────────────────────────────────────────────────────
export function BarraSaldos({ saldos, onGanar }: { saldos: Saldos; onGanar: () => void }) {
  return (
    <div className="sticky top-14 z-10 -mx-4 border-b bg-background/90 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        <ul className="flex flex-1 flex-wrap items-center gap-2" aria-label="Tus monedas">
          {CLAVES_MONEDA.map((m) => (
            <li key={m} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-semibold tabular-nums shadow-xs">
              <MonedaIcono moneda={m} className="size-4" />
              {saldos[m]}
              <span className="sr-only">{MONEDAS[m].nombre}</span>
            </li>
          ))}
        </ul>
        <Button type="button" size="sm" variant="outline" onClick={onGanar} className="gap-1.5" aria-label="Ganar monedas">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Ganar monedas</span>
        </Button>
      </div>
    </div>
  );
}

/** El «+» no vende monedas: lleva a las cosas que las dan (SPEC §8: sin dinero real) */
export function DialogoGanar({ abierto, onCambio }: { abierto: boolean; onCambio: (a: boolean) => void }) {
  const caminos = [
    { href: "/dashboard", icono: CalendarCheck, titulo: "Completá tus tareas", texto: "Cada tarea aprobada suma puntos." },
    { href: "/dashboard/habitos", icono: Sprout, titulo: "Cumplí tus hábitos", texto: "Sumás XP, incienso y rachas (¡y estrellas cada 7 días!)." },
    { href: "/dashboard/mis-premios", icono: Gift, titulo: "Reclamá tus premios", texto: "Cofres, regalos y reconocimientos pueden traer monedas." },
  ];
  return (
    <Dialog open={abierto} onOpenChange={onCambio}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">¿Cómo gano monedas?</DialogTitle>
          <DialogDescription>En la Tienda no se compra con dinero: todo se gana con esfuerzo y buenas obras.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {caminos.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-muted/60">
                <c.icono className="size-5 shrink-0 text-primary" aria-hidden />
                <span className="flex flex-col"><span className="text-sm font-semibold">{c.titulo}</span><span className="text-xs text-muted-foreground">{c.texto}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

// ─── Oferta del día ────────────────────────────────────────────────────────────────────────────────
function useCuentaRegresiva(fin: string) {
  const [resto, setResto] = useState<number | null>(null);
  useEffect(() => {
    const t = new Date(fin).getTime();
    const tick = () => setResto(Math.max(0, t - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fin]);
  if (resto === null) return "";
  const s = Math.floor(resto / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/** Solo lo que realmente vence tiene reloj: la fiesta de hoy (D17) */
export function OfertaDelDia({ oferta }: { oferta: NonNullable<TiendaVista["ofertaDia"]> }) {
  const cuenta = useCuentaRegresiva(oferta.termina);
  return (
    <Card className="flex-row items-center gap-4 overflow-hidden border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={oferta.imagenUrl} alt="" className="hidden aspect-[63/88] h-28 w-auto object-cover sm:block" loading="lazy" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <Badge className="w-fit gap-1 bg-amber-500 text-amber-950"><PartyPopper className="size-3" />Oferta del día</Badge>
        <h2 className="font-heading text-lg leading-tight font-semibold">{oferta.titulo}</h2>
        <p className="text-sm text-muted-foreground">{oferta.texto}</p>
        {cuenta && <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 tabular-nums dark:text-amber-400"><Clock className="size-3.5" />Termina en {cuenta}</p>}
      </div>
    </Card>
  );
}

// ─── Meta de ahorro ────────────────────────────────────────────────────────────────────────────────
export function MetaAhorro({ meta, saldos, onAbrir, onQuitar }: { meta: ProductoVista; saldos: Saldos; onAbrir: () => void; onQuitar: () => void }) {
  const opcion = meta.opciones[meta.opcionSugerida >= 0 ? meta.opcionSugerida : 0];
  if (!opcion) return null;
  const listo = meta.estado === "comprable";
  return (
    <Card className="flex-row items-center gap-3 p-3">
      <button type="button" onClick={onAbrir} className="size-16 shrink-0 overflow-hidden rounded-lg" aria-label={`Abrir ${meta.titulo}`}>
        <ArteProducto p={meta} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400"><Target className="size-3.5" />Mi meta</span>
        <button type="button" onClick={onAbrir} className="truncate text-left font-heading text-base font-semibold">{meta.titulo}</button>
        <div className="flex flex-col gap-1">
          {opcion.costos.map((c) => (
            <div key={c.moneda} className="flex items-center gap-2 text-xs tabular-nums">
              <MonedaIcono moneda={c.moneda} className="size-3.5" />
              <Progress value={Math.min(100, (saldos[c.moneda] / c.monto) * 100)} className="h-2 flex-1" />
              <span className="w-16 text-right text-muted-foreground">{Math.min(saldos[c.moneda], c.monto)}/{c.monto}</span>
            </div>
          ))}
        </div>
        {listo && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">¡Ya te alcanza!</span>}
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onQuitar} aria-label="Quitar mi meta"><X /></Button>
    </Card>
  );
}

// ─── Celebración ───────────────────────────────────────────────────────────────────────────────────
export function CompraExitosa({ resultado, onCerrar }: { resultado: ResultadoCompra | null; onCerrar: () => void }) {
  useEffect(() => {
    if (!resultado || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    confetti({ particleCount: 110, spread: 75, origin: { y: 0.65 }, colors: ["#C9A84C", "#F3E3CC", "#C4956A"] });
  }, [resultado]);

  const pendiente = resultado?.estado === "pendiente_aprobacion";
  const fisico = resultado?.tipo === "fisico";
  return (
    <Dialog open={!!resultado} onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="sm:max-w-sm">
        {resultado && (
          <>
            <DialogHeader className="items-center text-center">
              <span className={cn("flex size-16 items-center justify-center rounded-full", pendiente ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500")}>
                <CheckCircle2 className="size-9" aria-hidden />
              </span>
              <DialogTitle className="font-heading text-xl">{pendiente ? "¡Pedido enviado!" : "¡Compra lista!"}</DialogTitle>
              <DialogDescription>
                {pendiente
                  ? `Tus padres tienen que aprobar «${resultado.titulo}». Si no lo aprueban, te devuelven las monedas.`
                  : fisico
                    ? `«${resultado.titulo}» quedó en Mis premios. Tus padres te lo entregan.`
                    : `«${resultado.titulo}» ya es tuyo. Lo encontrás en Mis premios.`}
              </DialogDescription>
            </DialogHeader>
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">Pagaste <Precio costos={resultado.costos} className="text-foreground" /></p>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg"><Link href="/dashboard/mis-premios"><Gift />Ver en Mis premios</Link></Button>
              <Button variant="outline" onClick={onCerrar}>Seguir en la Tienda</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Historial ─────────────────────────────────────────────────────────────────────────────────────
type CompraHistorial = { id: number; estado: string; titulo: string; costos: { moneda: keyof typeof MONEDAS; monto: number }[]; createdAt: string; motivo: string | null };

const ETIQUETA_ESTADO: Record<string, { texto: string; variante: "default" | "secondary" | "outline" | "destructive" }> = {
  completada: { texto: "Comprado", variante: "secondary" },
  pendiente_aprobacion: { texto: "Esperando aprobación", variante: "outline" },
  rechazada: { texto: "Rechazado · te devolvimos las monedas", variante: "destructive" },
  cancelada: { texto: "Cancelado · te devolvimos las monedas", variante: "destructive" },
};

export function MisCompras({ version }: { version: number }) {
  const [compras, setCompras] = useState<CompraHistorial[] | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch("/api/tienda/compras")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => vivo && setCompras(d))
      .catch(() => vivo && setCompras([]));
    return () => {
      vivo = false;
    };
  }, [version]);

  if (compras === null) return <Skeleton className="h-24 w-full" />;
  if (compras.length === 0) return <p className="text-sm text-muted-foreground">Todavía no compraste nada. ¡Mirá el catálogo!</p>;
  return (
    <ul className="flex flex-col divide-y rounded-xl border">
      {compras.slice(0, 10).map((c) => {
        const e = ETIQUETA_ESTADO[c.estado] ?? ETIQUETA_ESTADO.completada;
        return (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{c.titulo}</span>
              <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("es-UY", { day: "numeric", month: "short" })}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Precio costos={c.costos} className="text-sm" />
              <Badge variant={e.variante}>{e.texto}</Badge>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
