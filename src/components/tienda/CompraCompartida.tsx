"use client";

// Componentes de Compra Compartida en la Tienda (lane 238):
// 1. FormularioCompraCompartida: selección de participantes (bloqueando a quienes no cumplan requisitos
//    del producto), distribución recomendada editable por moneda y envío de la solicitud.
// 2. SeccionComprasCompartidas: bandeja de solicitudes pendientes y recientes para aceptar, rechazar o cancelar.

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Clock, Lock, Sparkles, Users, X, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { MONEDAS, type Costo, type Moneda, type Saldos } from "@/lib/tienda/monedas";
import { recomendarDistribucion, validarDistribucion } from "@/lib/tienda/compartida";
import type {
  CompraCompartidaVista,
  MiembroTiendaVista,
  ProductoVista,
  ResultadoCompra,
  ResultadoRespuestaCompartida,
} from "@/lib/tienda/server";
import { ArteProducto } from "./ArteProducto";
import { MonedaIcono, Precio } from "./Moneda";

export function FormularioCompraCompartida({
  p,
  opcion,
  onCambiarOpcion,
  usuarioActual,
  familia,
  onVolver,
  onSolicitudCreada,
}: {
  p: ProductoVista;
  opcion: number;
  onCambiarOpcion: (idx: number) => void;
  usuarioActual: { id: number; nombre: string; fotoUrl: string | null; saldos: Saldos };
  familia: MiembroTiendaVista[];
  onVolver: () => void;
  onSolicitudCreada: (s: CompraCompartidaVista) => void;
}) {
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [aportes, setAportes] = useState<Record<number, Record<Moneda, number>>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elegida = p.opciones[opcion] ?? p.opciones[0];
  const costosTotales = useMemo(() => elegida?.costos ?? [], [elegida]);

  const participantesSeleccionados = useMemo(() => {
    const lista: { id: number; nombre: string; fotoUrl: string | null; saldos: Saldos; esSolicitante: boolean }[] = [
      { ...usuarioActual, esSolicitante: true },
    ];
    for (const id of seleccionados) {
      const m = familia.find((f) => f.id === id);
      if (m) lista.push({ id: m.id, nombre: m.nombre, fotoUrl: m.fotoUrl, saldos: m.saldos, esSolicitante: false });
    }
    return lista;
  }, [usuarioActual, seleccionados, familia]);

  function aplicarSugerencia(
    lista = participantesSeleccionados,
    costos = costosTotales
  ) {
    const sugeridos = recomendarDistribucion(
      costos,
      lista.map((x) => ({ usuarioId: x.id, saldos: x.saldos }))
    );
    const nuevoMapa: Record<number, Record<Moneda, number>> = {};
    for (const s of sugeridos) {
      const fila: Record<Moneda, number> = { puntos: 0, estrellas: 0, incienso: 0 };
      for (const c of s.costos) fila[c.moneda] = c.monto;
      nuevoMapa[s.usuarioId] = fila;
    }
    setAportes(nuevoMapa);
    setError(null);
  }

  // Cada vez que cambian los participantes o la opción de pago, recalcula la distribución recomendada
  useEffect(() => {
    aplicarSugerencia(participantesSeleccionados, costosTotales);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionados.join(","), opcion, p.id]);

  function alternarParticipante(id: number) {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function cambiarMonto(usuarioId: number, moneda: Moneda, valorTexto: string) {
    const num = valorTexto === "" ? 0 : Math.max(0, Math.trunc(Number(valorTexto) || 0));
    setAportes((prev) => ({
      ...prev,
      [usuarioId]: {
        ...(prev[usuarioId] ?? { puntos: 0, estrellas: 0, incienso: 0 }),
        [moneda]: num,
      },
    }));
    setError(null);
  }

  function completarResto(usuarioId: number, moneda: Moneda, totalRequerido: number) {
    const sumaOtros = participantesSeleccionados
      .filter((x) => x.id !== usuarioId)
      .reduce((acc, x) => acc + (aportes[x.id]?.[moneda] ?? 0), 0);
    const resto = Math.max(0, totalRequerido - sumaOtros);
    cambiarMonto(usuarioId, moneda, String(resto));
  }

  const validacion = useMemo(() => {
    return validarDistribucion(
      costosTotales,
      participantesSeleccionados.map((x) => ({
        usuarioId: x.id,
        nombre: x.esSolicitante ? `Vos (${x.nombre})` : x.nombre,
        saldos: x.saldos,
        costos: costosTotales.map((c) => ({
          moneda: c.moneda,
          monto: aportes[x.id]?.[c.moneda] ?? 0,
        })),
      }))
    );
  }, [costosTotales, participantesSeleccionados, aportes]);

  async function enviarSolicitud() {
    if (!validacion.ok) {
      setError(validacion.error);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/tienda/compartida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: p.id,
          opcion,
          participantes: validacion.aportes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo enviar la solicitud de compra compartida");
      toast.success("¡Solicitud enviada!", "Cuando todos acepten se descontarán las monedas y quedará hecha la compra.");
      onSolicitudCreada(data as CompraCompartidaVista);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {p.opciones.length > 1 && (
        <section aria-label="Forma de pago a compartir" className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">Forma de pago a compartir</h4>
          <div className="flex flex-wrap gap-2">
            {p.opciones.map((o, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onCambiarOpcion(i)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                  opcion === i ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
                )}
              >
                <Precio costos={o.costos} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Seleccionar participantes" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <Users className="size-4 text-primary" />
            1. Elegí con quiénes compartir
          </h4>
          <span className="text-xs text-muted-foreground">Todos deben cumplir los requisitos</span>
        </div>

        <ul className="flex flex-col gap-2">
          {familia.map((m) => {
            const aptitud = p.aptitudFamiliar?.[m.id] ?? { apto: true, motivo: null };
            const elegido = seleccionados.includes(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={!aptitud.apto}
                  onClick={() => alternarParticipante(m.id)}
                  aria-pressed={elegido}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition",
                    !aptitud.apto && "cursor-not-allowed bg-muted/40 opacity-60",
                    aptitud.apto && (elegido ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50")
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border text-xs",
                        !aptitud.apto
                          ? "border-muted-foreground/40 bg-muted text-muted-foreground"
                          : elegido
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background"
                      )}
                      aria-hidden
                    >
                      {!aptitud.apto ? <Lock className="size-3" /> : elegido ? <Check className="size-3.5" /> : null}
                    </span>
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src={m.fotoUrl ?? undefined} alt="" className="object-cover" />
                      <AvatarFallback>{m.nombre.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {m.nombre} <span className="text-xs font-normal text-muted-foreground">· Nivel {m.nivel}</span>
                      </span>
                      {!aptitud.apto ? (
                        <span className="text-xs text-destructive">{aptitud.motivo}</span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground tabular-nums">
                          {costosTotales.map((c) => (
                            <span key={c.moneda} className="inline-flex items-center gap-0.5">
                              {m.saldos[c.moneda]}
                              <MonedaIcono moneda={c.moneda} className="size-3" />
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  {!aptitud.apto && (
                    <Badge variant="outline" className="shrink-0 gap-1 text-[11px]">
                      <Lock className="size-3" />
                      Bloqueado
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {seleccionados.length > 0 && (
        <section aria-label="Distribución del pago" className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold">2. ¿Cuánto aporta cada uno?</h4>
              <span className="text-xs text-muted-foreground">
                La distribución es sugerida: podés cambiar cuánto aporta cada persona en cada moneda.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => aplicarSugerencia()}
              className="h-8 gap-1 text-xs"
            >
              <Sparkles className="size-3.5" />
              Reparto sugerido
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            {participantesSeleccionados.map((part) => (
              <div key={part.id} className="flex flex-col gap-2 rounded-lg border bg-card p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarImage src={part.fotoUrl ?? undefined} alt="" className="object-cover" />
                      <AvatarFallback className="text-xs">{part.nombre.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {part.esSolicitante ? `${part.nombre} (vos)` : part.nombre}
                    </span>
                  </div>
                  <Precio
                    costos={costosTotales
                      .map((c) => ({ moneda: c.moneda, monto: aportes[part.id]?.[c.moneda] ?? 0 }))
                      .filter((c) => c.monto > 0)}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {costosTotales.map((c) => {
                    const valor = aportes[part.id]?.[c.moneda] ?? 0;
                    const disponible = part.saldos[c.moneda] ?? 0;
                    const excede = valor > disponible;
                    const sumaActual = participantesSeleccionados.reduce(
                      (acc, x) => acc + (aportes[x.id]?.[c.moneda] ?? 0),
                      0
                    );
                    const inputId = `aporte-${part.id}-${c.moneda}`;
                    return (
                      <div key={c.moneda} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <Label htmlFor={inputId} className="flex items-center gap-1 font-medium">
                            <MonedaIcono moneda={c.moneda} className="size-3.5" />
                            {MONEDAS[c.moneda].nombre}
                          </Label>
                          <span className={cn("tabular-nums", excede ? "font-semibold text-destructive" : "text-muted-foreground")}>
                            saldo: {disponible}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input
                            id={inputId}
                            type="number"
                            min={0}
                            max={c.monto}
                            value={valor}
                            onChange={(e) => cambiarMonto(part.id, c.moneda, e.target.value)}
                            className={cn("h-9 tabular-nums", excede && "border-destructive")}
                          />
                          {sumaActual !== c.monto && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => completarResto(part.id, c.moneda, c.monto)}
                              className="h-9 shrink-0 px-2 text-xs"
                              title="Asignar lo que falta o sobra en esta moneda"
                            >
                              Resto
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de suma por moneda */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">
            <span className="font-medium">Total repartido:</span>
            <div className="flex flex-wrap items-center gap-3 tabular-nums">
              {costosTotales.map((c) => {
                const suma = participantesSeleccionados.reduce(
                  (acc, x) => acc + (aportes[x.id]?.[c.moneda] ?? 0),
                  0
                );
                const coincide = suma === c.monto;
                return (
                  <span
                    key={c.moneda}
                    className={cn(
                      "inline-flex items-center gap-1 font-semibold",
                      coincide ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                    )}
                  >
                    {suma}/{c.monto}
                    <MonedaIcono moneda={c.moneda} className="size-3.5" />
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {(error || (!validacion.ok && seleccionados.length > 0)) && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error ?? (!validacion.ok ? validacion.error : null)}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <Button
          size="lg"
          disabled={enviando || !validacion.ok}
          onClick={enviarSolicitud}
          className="w-full gap-2"
        >
          {enviando && <Spinner />}
          <Users className="size-4" />
          Enviar solicitud de compra compartida
        </Button>
        <Button variant="outline" disabled={enviando} onClick={onVolver} className="w-full">
          Volver al producto
        </Button>
      </div>
    </div>
  );
}

const BADGE_PARTICIPANTE: Record<
  "pendiente" | "aceptada" | "rechazada",
  { texto: string; clase: string; icono: typeof Clock }
> = {
  pendiente: {
    texto: "Pendiente",
    clase: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icono: Clock,
  },
  aceptada: {
    texto: "Aceptó",
    clase: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icono: CheckCircle2,
  },
  rechazada: {
    texto: "Rechazó",
    clase: "border-destructive/40 bg-destructive/10 text-destructive",
    icono: XCircle,
  },
};

export function SeccionComprasCompartidas({
  solicitudes,
  usuarioActualId,
  onActualizado,
  onCompraCompletada,
}: {
  solicitudes: CompraCompartidaVista[];
  usuarioActualId: number;
  onActualizado: () => void;
  onCompraCompletada: (r: ResultadoCompra) => void;
}) {
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente");
  if (pendientes.length === 0) return null;

  async function responder(id: number, accion: "aceptar" | "rechazar" | "cancelar") {
    setOcupadoId(id);
    try {
      const res = await fetch(`/api/tienda/compartida/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const data = (await res.json().catch(() => ({}))) as ResultadoRespuestaCompartida & { error?: string };
      if (!res.ok) throw new Error(data.error || "No se pudo procesar tu respuesta");

      if (data.resultadoCompra) {
        toast.success("¡Compra compartida completada!", "Todos aceptaron y se descontó lo acordado.");
        onCompraCompletada(data.resultadoCompra);
      } else if (accion === "aceptar") {
        toast.success("¡Aceptaste tu parte!", "Cuando acepten los demás se hará la compra.");
        onActualizado();
      } else if (accion === "rechazar") {
        toast.info("Rechazaste la solicitud de compra compartida");
        onActualizado();
      } else {
        toast.info("Solicitud cancelada");
        onActualizado();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo procesar la solicitud");
    } finally {
      setOcupadoId(null);
    }
  }

  return (
    <section aria-labelledby="titulo-compartidas" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <h2 id="titulo-compartidas" className="font-heading text-lg font-semibold">
          Compras compartidas pendientes
        </h2>
        <Badge className="tabular-nums">{pendientes.length}</Badge>
      </div>

      <div className="flex flex-col gap-3">
        {pendientes.map((s) => {
          const miPart = s.participantes.find((p) => p.usuarioId === usuarioActualId);
          const deboResponder = miPart?.estado === "pendiente";
          const soySolicitante = s.solicitante.id === usuarioActualId;
          const aceptadasCount = s.participantes.filter((p) => p.estado === "aceptada").length;
          const ocupado = ocupadoId === s.id;

          return (
            <Card key={s.id} className="flex flex-col gap-3 border-primary/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <ArteProducto p={{ tipo: s.tipo, sistemaClave: null, imagenUrl: s.imagenUrl, titulo: s.titulo }} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-base font-semibold">{s.titulo}</h3>
                      <Badge variant="outline" className="tabular-nums">
                        {aceptadasCount}/{s.participantes.length} aceptaron
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Propuesta por <strong>{soySolicitante ? "vos" : s.solicitante.nombre}</strong> · Total:{" "}
                      <Precio costos={s.costosTotales} className="inline-flex text-xs text-foreground" />
                    </p>
                  </div>
                </div>

                {deboResponder && miPart && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      disabled={ocupado || !miPart.alcanzaSaldo}
                      onClick={() => responder(s.id, "aceptar")}
                      className="gap-1.5"
                    >
                      {ocupado ? <Spinner /> : <Check className="size-4" />}
                      Aceptar mi parte
                      {miPart.costos.length > 0 && (
                        <span className="ml-0.5 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
                          <Precio costos={miPart.costos} className="text-xs" />
                        </span>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={ocupado}
                      onClick={() => responder(s.id, "rechazar")}
                      className="gap-1"
                    >
                      <X className="size-4" />
                      Rechazar
                    </Button>
                  </div>
                )}

                {!deboResponder && soySolicitante && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={ocupado}
                    onClick={() => responder(s.id, "cancelar")}
                    className="gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                    Cancelar solicitud
                  </Button>
                )}
              </div>

              {deboResponder && miPart && !miPart.alcanzaSaldo && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  No te alcanzan las monedas para cubrir tu parte (<Precio costos={miPart.costos} className="text-xs" />). Sumá monedas o rechazá la solicitud.
                </p>
              )}

              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {s.participantes.map((p) => {
                  const info = BADGE_PARTICIPANTE[p.estado];
                  const Icono = info.icono;
                  return (
                    <li
                      key={p.usuarioId}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-2.5 py-2 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="size-6 shrink-0">
                          <AvatarImage src={p.fotoUrl ?? undefined} alt="" className="object-cover" />
                          <AvatarFallback className="text-[10px]">{p.nombre.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {p.usuarioId === usuarioActualId ? `${p.nombre} (vos)` : p.nombre}
                          </span>
                          {p.costos.length > 0 ? (
                            <Precio costos={p.costos} className="text-xs" />
                          ) : (
                            <span className="text-muted-foreground">0 monedas</span>
                          )}
                        </div>
                      </div>
                      <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", info.clase)}>
                        <Icono className="size-3" aria-hidden />
                        {info.texto}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
