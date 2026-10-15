"use client";

// Compra directa de fragmentos de una carta (antes vivía en la pestaña «Tienda» de Cartas).
// Misma lógica y misma API (`/api/cartas/comprar`); ahora dentro del detalle del producto.
import { useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FRAGMENTOS_POR_ESTRELLA,
  TOPE_DIARIO_FRAGMENTOS_PUNTOS,
  XP_MINIMO_RAREZA,
  precioFragmentoEnIncienso,
  precioFragmentoEnPuntos,
} from "@/lib/cartas/economia";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { CartaListada } from "@/lib/cartas/server";
import type { Moneda } from "@/lib/tienda/monedas";
import { MonedaIcono } from "./Moneda";

type Datos = { cartas: CartaListada[]; usuario: { availablePoints: number; incienso: number; stars: number; xp: number } };

export function FragmentosCartas({ onResultado }: { onResultado: (resultado: unknown) => void }) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cartaId, setCartaId] = useState<number | null>(null);
  const [cantidadElegida, setCantidad] = useState(1);
  const [monedaElegida, setMoneda] = useState<Moneda>("puntos");
  const [confirmando, setConfirmando] = useState(false);
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/cartas")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Datos) => {
        if (!vivo) return;
        setDatos(d);
        setCartaId(d.cartas[0]?.id ?? null);
      })
      .catch(() => vivo && setError("No se pudieron cargar las cartas"));
    return () => {
      vivo = false;
    };
  }, []);

  const carta = useMemo(() => datos?.cartas.find((c) => c.id === cartaId) ?? datos?.cartas[0], [datos, cartaId]);
  const hoy = useMemo(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  if (!datos || !carta) {
    return error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <Skeleton className="h-40 w-full" />;
  }

  // Las Celestiales no se compran con puntos y las estrellas solo sirven para ellas
  const esCelestial = carta.rareza === "Celestial";
  const moneda: Moneda = esCelestial && monedaElegida === "puntos" ? "estrellas" : !esCelestial && monedaElegida === "estrellas" ? "puntos" : monedaElegida;
  const tope = moneda === "puntos" ? TOPE_DIARIO_FRAGMENTOS_PUNTOS : 50;
  const cantidad =
    moneda === "estrellas"
      ? Math.max(FRAGMENTOS_POR_ESTRELLA, Math.round(cantidadElegida / FRAGMENTOS_POR_ESTRELLA) * FRAGMENTOS_POR_ESTRELLA)
      : Math.min(cantidadElegida, tope);
  const unitario = moneda === "estrellas" ? 1 / FRAGMENTOS_POR_ESTRELLA : moneda === "puntos" ? precioFragmentoEnPuntos(carta.rareza) : precioFragmentoEnIncienso(carta.rareza);
  const costo = Math.round(unitario * cantidad);
  const saldo = moneda === "puntos" ? datos.usuario.availablePoints : moneda === "estrellas" ? datos.usuario.stars : datos.usuario.incienso;
  const xpMinimo = XP_MINIMO_RAREZA[carta.rareza];
  const xpFalta = Math.max(0, xpMinimo - datos.usuario.xp);
  const puede = saldo >= costo && xpFalta === 0;
  const fiesta = carta.celebracion === hoy;

  async function comprar() {
    setComprando(true);
    setError(null);
    try {
      const res = await fetch("/api/cartas/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "fragmentos", cartaId: carta!.id, cantidad, moneda }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar la compra");
      onResultado({
        nombreSobre: `Fragmentos de ${data.nombre}`,
        nuevoSaldoPuntos: data.nuevoSaldoPuntos,
        nuevoSaldoIncienso: data.nuevoSaldoIncienso,
        totalInciensoGanado: data.inciensoGanado,
        cartasAfectadas: [
          {
            cartaId: data.cartaId,
            cartaClave: data.clave,
            nombre: data.nombre,
            rareza: carta!.rareza,
            cantidadBase: cantidad,
            cantidadFinal: data.cantidadFinal,
            bonoFiestaAplicado: data.bonoFiestaAplicado,
            fragmentosAntes: data.fragmentosAntes,
            fragmentosDespues: data.fragmentosDespues,
            desbloquea: data.desbloquea,
            gradoAntes: data.gradoAntes,
            gradoDespues: data.gradoDespues,
            imagenUrl: data.imagenUrl,
            reclamable: data.reclamable,
            excedente: data.excedente,
            inciensoGanado: data.inciensoGanado,
          },
        ],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado al comprar");
      setConfirmando(false);
    } finally {
      setComprando(false);
    }
  }

  const nombresMoneda: Record<Moneda, string> = { puntos: "Puntos", incienso: "Incienso", estrellas: "Estrellas" };

  return (
    <section aria-label="Comprar fragmentos" className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Carta
        <NativeSelect value={carta.id} onChange={(e) => { setCartaId(Number(e.target.value)); setConfirmando(false); }} className="w-full font-normal">
          {datos.cartas.map((c) => (
            <NativeSelectOption key={c.id} value={c.id}>{c.nombre} ({TEXTOS_CARTAS.rarezas[c.rareza]})</NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
      {fiesta && <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"><Calendar className="size-3.5" />¡Hoy es su fiesta! Los fragmentos valen ×1,5.</p>}
      {xpMinimo > 0 && <p className={`text-xs ${xpFalta > 0 ? "text-destructive" : "text-muted-foreground"}`}>{xpFalta > 0 ? `Necesitás ${xpMinimo} XP (te faltan ${xpFalta}).` : `Requiere ${xpMinimo} XP.`}</p>}

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Moneda">
        {(["puntos", "incienso", "estrellas"] as Moneda[]).map((m) => {
          const bloqueada = m === "puntos" ? esCelestial : m === "estrellas" ? !esCelestial : false;
          return (
            <Button key={m} type="button" role="radio" aria-checked={moneda === m} variant={moneda === m ? "default" : "outline"} disabled={bloqueada} onClick={() => { setMoneda(m); setConfirmando(false); }} className="h-12 flex-col gap-0.5 text-xs">
              <MonedaIcono moneda={m} />
              {nombresMoneda[m]}
            </Button>
          );
        })}
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        <span className="flex justify-between">Cantidad {moneda === "puntos" && <span className="text-xs font-normal text-muted-foreground">Tope: {TOPE_DIARIO_FRAGMENTOS_PUNTOS} por día</span>}</span>
        <input
          type="number"
          inputMode="numeric"
          min={moneda === "estrellas" ? FRAGMENTOS_POR_ESTRELLA : 1}
          step={moneda === "estrellas" ? FRAGMENTOS_POR_ESTRELLA : 1}
          max={tope}
          value={cantidad}
          onChange={(e) => { setCantidad(Math.max(1, Math.min(tope, Number(e.target.value) || 1))); setConfirmando(false); }}
          className="h-11 rounded-lg border bg-background px-3 text-base font-normal tabular-nums focus-visible:outline-2 focus-visible:outline-ring"
        />
      </label>

      <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="flex items-center gap-1.5 text-lg font-semibold tabular-nums">{costo}<MonedaIcono moneda={moneda} className="size-5" /></span>
      </div>

      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {!confirmando ? (
        <Button size="lg" disabled={!puede} onClick={() => setConfirmando(true)} className="w-full">
          {puede ? `Comprar ${cantidad} fragmento${cantidad === 1 ? "" : "s"}` : xpFalta > 0 ? `Te faltan ${xpFalta} XP` : `Te faltan ${costo - saldo} ${nombresMoneda[moneda].toLowerCase()}`}
        </Button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
          <p className="text-sm">Vas a pagar <strong>{costo}</strong> {nombresMoneda[moneda].toLowerCase()} por {cantidad} fragmento{cantidad === 1 ? "" : "s"} de <strong>{carta.nombre}</strong>. Te quedarán {saldo - costo}.</p>
          <Button size="lg" disabled={comprando} onClick={comprar} className="w-full gap-2">{comprando && <Spinner />}Sí, comprar</Button>
          <Button variant="outline" disabled={comprando} onClick={() => setConfirmando(false)}>Volver</Button>
        </div>
      )}
    </section>
  );
}
