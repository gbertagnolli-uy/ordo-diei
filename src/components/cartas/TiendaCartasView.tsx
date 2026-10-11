"use client";

import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Flame,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  SOBRE_MEDITACION,
  SOBRE_REVELACION,
  TOPE_DIARIO_FRAGMENTOS_PUNTOS,
  precioFragmentoEnPuntos,
  precioFragmentoEnIncienso,
} from "@/lib/cartas/economia";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { ContenidoCartaVisible } from "@/lib/cartas/revelado";
import type { ResultadoCompraSobre } from "@/components/cartas/ModalAperturaSobre";

interface TiendaCartasViewProps {
  cartas: ContenidoCartaVisible[];
  usuario: {
    availablePoints: number;
    incienso: number;
  };
  onCompraExitosa: (resultado: ResultadoCompraSobre) => void;
  onActualizarSaldo: (nuevoPuntos: number, nuevoIncienso: number) => void;
}

export function TiendaCartasView({
  cartas,
  usuario,
  onCompraExitosa,
  onActualizarSaldo,
}: TiendaCartasViewProps) {
  const [comprando, setComprando] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Estado para compra directa de fragmentos
  const [cartaSeleccionadaId, setCartaSeleccionadaId] = useState<number>(cartas[0]?.id ?? 1);
  const [cantidadFragmentos, setCantidadFragmentos] = useState<number>(1);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<"puntos" | "incienso">("puntos");

  // Estado del Diálogo de Confirmación
  const [confirmacionOpen, setConfirmacionOpen] = useState<boolean>(false);
  const [datosConfirmacion, setDatosConfirmacion] = useState<{
    tipo: "sobre" | "fragmentos";
    sobre?: "meditacion" | "revelacion";
    nombre: string;
    costo: number;
    moneda: "puntos" | "incienso";
    detalles: string;
  } | null>(null);

  const cartaSeleccionada = useMemo(() => {
    return cartas.find((c) => c.id === cartaSeleccionadaId) ?? cartas[0];
  }, [cartas, cartaSeleccionadaId]);

  // Cálculo de festividad hoy (MM-DD)
  const hoyMmDd = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}-${dd}`;
  }, []);

  const cartasEnFiestaHoy = useMemo(() => {
    return cartas.filter((c) => c.celebracion === hoyMmDd);
  }, [cartas, hoyMmDd]);

  const esFiestaCartaSeleccionada = cartaSeleccionada?.celebracion === hoyMmDd;

  // Cálculos de costo compra directa
  const costoUnitario = useMemo(() => {
    if (!cartaSeleccionada) return 0;
    return monedaSeleccionada === "puntos"
      ? precioFragmentoEnPuntos(cartaSeleccionada.rareza)
      : precioFragmentoEnIncienso(cartaSeleccionada.rareza);
  }, [cartaSeleccionada, monedaSeleccionada]);

  const costoTotalDirecto = costoUnitario * cantidadFragmentos;

  // Validación de saldos
  const saldoSuficienteDirecto =
    monedaSeleccionada === "puntos"
      ? usuario.availablePoints >= costoTotalDirecto
      : usuario.incienso >= costoTotalDirecto;

  const puntosFaltantesMeditacion = Math.max(0, SOBRE_MEDITACION.costoPuntos - usuario.availablePoints);
  const puntosFaltantesRevelacion = Math.max(0, SOBRE_REVELACION.costoPuntos - usuario.availablePoints);

  const solicitarCompraSobre = (sobre: "meditacion" | "revelacion") => {
    setErrorMensaje(null);
    const config = sobre === "meditacion" ? SOBRE_MEDITACION : SOBRE_REVELACION;
    setDatosConfirmacion({
      tipo: "sobre",
      sobre,
      nombre: config.nombre,
      costo: config.costoPuntos,
      moneda: "puntos",
      detalles: TEXTOS_CARTAS.sobres[sobre].descripcion,
    });
    setConfirmacionOpen(true);
  };

  const solicitarCompraFragmentos = () => {
    setErrorMensaje(null);
    if (!cartaSeleccionada) return;
    setDatosConfirmacion({
      tipo: "fragmentos",
      nombre: `${cantidadFragmentos} fragmento(s) de ${cartaSeleccionada.nombre}`,
      costo: costoTotalDirecto,
      moneda: monedaSeleccionada,
      detalles: `Compra directa de fragmentos para consagración (${TEXTOS_CARTAS.rarezas[cartaSeleccionada.rareza]})${
        esFiestaCartaSeleccionada ? " · ¡Incluye bono de fiesta ×1,5!" : ""
      }`,
    });
    setConfirmacionOpen(true);
  };

  const ejecutarCompra = async () => {
    if (!datosConfirmacion) return;
    setConfirmacionOpen(false);
    setComprando(true);
    setErrorMensaje(null);

    try {
      let bodyPayload: Record<string, unknown>;
      if (datosConfirmacion.tipo === "sobre") {
        bodyPayload = { tipo: "sobre", sobre: datosConfirmacion.sobre };
      } else {
        bodyPayload = {
          tipo: "fragmentos",
          cartaId: cartaSeleccionada?.id,
          cantidad: cantidadFragmentos,
          moneda: monedaSeleccionada,
        };
      }

      const res = await fetch("/api/cartas/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la compra");
      }

      // Actualizar saldos
      if (data.nuevoSaldoPuntos !== undefined && data.nuevoSaldoIncienso !== undefined) {
        onActualizarSaldo(data.nuevoSaldoPuntos, data.nuevoSaldoIncienso);
      }

      // Disparar modal de apertura o confirmación
      if (datosConfirmacion.tipo === "sobre") {
        onCompraExitosa(data);
      } else {
        // Envolver resultado de compra directa para el modal
        const envoltorio = {
          nombreSobre: `Fragmentos de ${data.nombre}`,
          nuevoSaldoPuntos: data.nuevoSaldoPuntos,
          nuevoSaldoIncienso: data.nuevoSaldoIncienso,
          totalInciensoGanado: data.inciensoGanado,
          cartasAfectadas: [
            {
              cartaId: data.cartaId,
              cartaClave: data.clave,
              nombre: data.nombre,
              rareza: cartaSeleccionada?.rareza || "Comun",
              cantidadBase: cantidadFragmentos,
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
        };
        onCompraExitosa(envoltorio);
      }
    } catch (err: unknown) {
      setErrorMensaje(err instanceof Error ? err.message : "Error inesperado al comprar");
    } finally {
      setComprando(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-2">
      {/* Banner de Festividades Litúrgicas de Hoy (D17) */}
      {cartasEnFiestaHoy.length > 0 && (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Calendar className="size-4" />
            <span>¡Hoy la Iglesia está de fiesta! (Bono de Tienda ×1,5)</span>
          </div>
          <p className="text-xs">
            {cartasEnFiestaHoy.map((c) => (
              <span key={c.clave} className="block">
                Hoy los sobres y compras directas otorgan <strong>×1,5 en fragmentos de {c.nombre}</strong>.
              </span>
            ))}
          </p>
        </div>
      )}

      {errorMensaje && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-sm font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMensaje}</span>
        </div>
      )}

      {/* SECCIÓN 1: SOBRES SAGRADOS */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Sobres de Cartas
          </h2>
          <p className="text-xs text-muted-foreground">
            Ofrendá tus puntos acumulados para revelar fragmentos al azar mediante el sorteo de dos etapas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sobre de Meditación */}
          <Card className="flex flex-col justify-between border-stone-800 bg-stone-950 text-stone-100 shadow-xl overflow-hidden relative">
            <div className="absolute -top-12 -right-12 size-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-xs">
                  5 Fragmentos
                </Badge>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Award className="size-3.5" />
                  <span>{SOBRE_MEDITACION.costoPuntos} puntos</span>
                </div>
              </div>
              <CardTitle className="font-heading text-lg font-bold text-stone-100 mt-2">
                {SOBRE_MEDITACION.nombre}
              </CardTitle>
              <CardDescription className="text-xs text-stone-400">
                {TEXTOS_CARTAS.sobres.meditacion.descripcion}
              </CardDescription>
            </CardHeader>

            <CardContent className="text-xs text-stone-400 flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-stone-300">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                Ideal para completar los misterios del Rosario y santos protectores.
              </span>
              <span className="text-[11px] text-stone-500 italic">
                Cartas Comunes (60 %) y Buenas (28 %).
              </span>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                onClick={() => solicitarCompraSobre("meditacion")}
                disabled={comprando || usuario.availablePoints < SOBRE_MEDITACION.costoPuntos}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs"
              >
                {usuario.availablePoints >= SOBRE_MEDITACION.costoPuntos ? (
                  `Abrir Sobre (${SOBRE_MEDITACION.costoPuntos} pts)`
                ) : (
                  `Te faltan ${puntosFaltantesMeditacion} puntos`
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Sobre de Revelación */}
          <Card className="flex flex-col justify-between border-stone-800 bg-stone-950 text-stone-100 shadow-xl overflow-hidden relative">
            <div className="absolute -top-12 -right-12 size-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
                  8 Fragmentos · Garantizado
                </Badge>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Award className="size-3.5" />
                  <span>{SOBRE_REVELACION.costoPuntos} puntos</span>
                </div>
              </div>
              <CardTitle className="font-heading text-lg font-bold text-stone-100 mt-2">
                {SOBRE_REVELACION.nombre}
              </CardTitle>
              <CardDescription className="text-xs text-stone-400">
                {TEXTOS_CARTAS.sobres.revelacion.descripcion}
              </CardDescription>
            </CardHeader>

            <CardContent className="text-xs text-stone-400 flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-stone-300">
                <Sparkles className="size-3.5 text-amber-400" />
                Garantiza al menos 4 fragmentos de cartas Perfectas o Celestiales.
              </span>
              <span className="text-[11px] text-stone-500 italic">
                Sagrarios marianos, arcángeles, apóstoles insignes y la Eucaristía.
              </span>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                onClick={() => solicitarCompraSobre("revelacion")}
                disabled={comprando || usuario.availablePoints < SOBRE_REVELACION.costoPuntos}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs"
              >
                {usuario.availablePoints >= SOBRE_REVELACION.costoPuntos ? (
                  `Abrir Sobre (${SOBRE_REVELACION.costoPuntos} pts)`
                ) : (
                  `Te faltan ${puntosFaltantesRevelacion} puntos`
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* SECCIÓN 2: COMPRA DIRECTA DE FRAGMENTOS (D2) */}
      <div className="flex flex-col gap-4 mt-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Consagración Directa de Fragmentos
          </h2>
          <p className="text-xs text-muted-foreground">
            Elegí una carta en particular y adquirí fragmentos específicos con puntos o Granos de Incienso.
          </p>
        </div>

        <Card className="border-muted bg-card">
          <CardContent className="pt-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Selector de Carta */}
              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className="text-xs font-semibold text-foreground">
                  Carta a consagrar:
                </label>
                <select
                  value={cartaSeleccionadaId}
                  onChange={(e) => setCartaSeleccionadaId(Number(e.target.value))}
                  className="h-10 px-3 rounded-lg border bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  {cartas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({TEXTOS_CARTAS.rarezas[c.rareza]})
                    </option>
                  ))}
                </select>
                {esFiestaCartaSeleccionada && (
                  <span className="text-[11px] text-amber-500 font-medium">
                    ★ ¡Hoy tiene bono ×1,5 de fiesta!
                  </span>
                )}
              </div>

              {/* Selector de Cantidad */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex justify-between">
                  <span>Cantidad de fragmentos:</span>
                  {monedaSeleccionada === "puntos" && (
                    <span className="text-[10px] text-muted-foreground">
                      (Tope: {TOPE_DIARIO_FRAGMENTOS_PUNTOS}/día)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  max={monedaSeleccionada === "puntos" ? TOPE_DIARIO_FRAGMENTOS_PUNTOS : 50}
                  value={cantidadFragmentos}
                  onChange={(e) =>
                    setCantidadFragmentos(
                      Math.max(
                        1,
                        Math.min(
                          monedaSeleccionada === "puntos" ? TOPE_DIARIO_FRAGMENTOS_PUNTOS : 50,
                          Number(e.target.value) || 1
                        )
                      )
                    )
                  }
                  className="h-10 px-3 rounded-lg border bg-background text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring tabular-nums"
                />
              </div>

              {/* Selector de Moneda */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Medio de ofrenda:
                </label>
                <div className="grid grid-cols-2 gap-2 h-10">
                  <Button
                    type="button"
                    variant={monedaSeleccionada === "puntos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setMonedaSeleccionada("puntos");
                      if (cantidadFragmentos > TOPE_DIARIO_FRAGMENTOS_PUNTOS) {
                        setCantidadFragmentos(TOPE_DIARIO_FRAGMENTOS_PUNTOS);
                      }
                    }}
                    className="text-xs gap-1.5 h-full"
                  >
                    <Award className="size-3.5" />
                    <span>Puntos</span>
                  </Button>
                  <Button
                    type="button"
                    variant={monedaSeleccionada === "incienso" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMonedaSeleccionada("incienso")}
                    className="text-xs gap-1.5 h-full"
                  >
                    <Flame className="size-3.5 text-orange-500" />
                    <span>Incienso</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Resumen del Costo y Botón de Compra */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-xs text-muted-foreground">Costo de la ofrenda:</span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  {monedaSeleccionada === "puntos" ? (
                    <Award className="size-4 text-amber-500" />
                  ) : (
                    <Flame className="size-4 text-orange-500" />
                  )}
                  <span>
                    {costoTotalDirecto}{" "}
                    {monedaSeleccionada === "puntos" ? "puntos" : "granos de incienso"}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({costoUnitario} c/u)
                  </span>
                </div>
              </div>

              <Button
                onClick={solicitarCompraFragmentos}
                disabled={comprando || !saldoSuficienteDirecto}
                className="w-full sm:w-auto text-xs px-6"
              >
                {saldoSuficienteDirecto
                  ? `Comprar ${cantidadFragmentos} fragmento(s)`
                  : monedaSeleccionada === "puntos"
                  ? `Te faltan ${costoTotalDirecto - usuario.availablePoints} puntos`
                  : `Te faltan ${costoTotalDirecto - usuario.incienso} granos`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DIÁLOGO DE CONFIRMACIÓN ANTES DE GASTAR */}
      <Dialog open={confirmacionOpen} onOpenChange={setConfirmacionOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              Confirmar Ofrenda
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Estás por realizar una ofrenda en la tienda sagrada.
            </DialogDescription>
          </DialogHeader>

          {datosConfirmacion && (
            <div className="flex flex-col gap-3 py-2 text-sm">
              <div className="flex flex-col p-3 rounded-lg bg-muted/40 border">
                <span className="font-semibold text-foreground">
                  {datosConfirmacion.nombre}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {datosConfirmacion.detalles}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-muted-foreground">Costo a descontar:</span>
                <span className="font-bold text-foreground tabular-nums">
                  {datosConfirmacion.costo} {datosConfirmacion.moneda}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmacionOpen(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={ejecutarCompra}>
              Confirmar y Ofrendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
