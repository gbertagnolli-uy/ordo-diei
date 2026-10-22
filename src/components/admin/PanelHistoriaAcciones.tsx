"use client";

import { useEffect, useState, useMemo } from "react";
import {
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Gift,
  ShoppingCart,
  Search,
  Filter,
  User,
  AlertTriangle,
  History,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import type { AccionHistorial, TipoAccionHistorial } from "@/lib/admin/historiaAcciones";

export function PanelHistoriaAcciones() {
  const [acciones, setAcciones] = useState<AccionHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<"todas" | TipoAccionHistorial>("todas");
  const [filtroUsuario, setFiltroUsuario] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [accionARevertir, setAccionARevertir] = useState<AccionHistorial | null>(null);
  const [procesandoReversion, setProcesandoReversion] = useState(false);

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/admin/historia-acciones");
      if (!res.ok) throw new Error("Error al obtener historial");
      const data = await res.json();
      setAcciones(data.acciones || []);
    } catch {
      toast.error("No se pudo cargar el historial de acciones");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const usuariosUnicos = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; fotoUrl: string | null }>();
    for (const a of acciones) {
      if (!map.has(a.usuario.id)) {
        map.set(a.usuario.id, {
          id: a.usuario.id,
          nombre: a.usuario.nombre,
          fotoUrl: a.usuario.fotoUrl,
        });
      }
    }
    return Array.from(map.values());
  }, [acciones]);

  const accionesFiltradas = useMemo(() => {
    return acciones.filter((a) => {
      if (filtroTipo !== "todas" && a.tipo !== filtroTipo) return false;
      if (filtroUsuario !== null && a.usuario.id !== filtroUsuario) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const coincideTitulo = a.titulo.toLowerCase().includes(q);
        const coincideUsuario = a.usuario.nombre.toLowerCase().includes(q);
        const coincideSubtitulo = a.subtitulo?.toLowerCase().includes(q);
        if (!coincideTitulo && !coincideUsuario && !coincideSubtitulo) return false;
      }
      return true;
    });
  }, [acciones, filtroTipo, filtroUsuario, busqueda]);

  const handleConfirmarReversion = async () => {
    if (!accionARevertir) return;
    setProcesandoReversion(true);
    try {
      const res = await fetch("/api/admin/historia-acciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: accionARevertir.tipo,
          id: accionARevertir.referenciaId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo revertir la acción");
      }

      toast.success(data.mensaje || "Acción revertida correctamente");
      setAccionARevertir(null);
      await cargarHistorial();
    } catch (err: any) {
      toast.error(err.message || "Error al revertir la acción");
    } finally {
      setProcesandoReversion(false);
    }
  };

  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return iso;
    }
  };

  const getTipoIcon = (tipo: TipoAccionHistorial) => {
    switch (tipo) {
      case "tarea":
        return <CheckCircle2 className="size-4 text-emerald-400" />;
      case "habito":
        return <Sparkles className="size-4 text-sky-400" />;
      case "premio":
        return <Gift className="size-4 text-purple-400" />;
      case "compra":
        return <ShoppingCart className="size-4 text-amber-400" />;
    }
  };

  const getTipoBadge = (tipo: TipoAccionHistorial) => {
    switch (tipo) {
      case "tarea":
        return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Tarea</Badge>;
      case "habito":
        return <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300">Hábito</Badge>;
      case "premio":
        return <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-300">Premio</Badge>;
      case "compra":
        return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300">Compra</Badge>;
    }
  };

  return (
    <Card className="w-full border-white/10 bg-card/60 backdrop-blur-sm shadow-xl">
      <CardHeader className="border-b border-white/5 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <History className="size-5" />
              </div>
              <CardTitle className="text-xl font-heading tracking-wide">
                Historial de Acciones y Reversión
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-sm">
              Log de tareas aprobadas, hábitos aprobados, premios entregados y compras con opción de revertir.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={cargarHistorial}
            disabled={cargando}
            className="self-start sm:self-auto gap-2 text-xs"
          >
            {cargando ? <Spinner className="size-3.5" /> : <RotateCcw className="size-3.5" />}
            Actualizar log
          </Button>
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-2">
          {/* Tipos */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "todas", label: "Todas" },
                { id: "tarea", label: "Tareas" },
                { id: "habito", label: "Hábitos" },
                { id: "premio", label: "Premios" },
                { id: "compra", label: "Compras" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setFiltroTipo(t.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  filtroTipo === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Filtro Usuario */}
          {usuariosUnicos.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFiltroUsuario(null)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  filtroUsuario === null
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Toda la familia
              </button>
              {usuariosUnicos.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setFiltroUsuario(u.id === filtroUsuario ? null : u.id)}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-all ${
                    filtroUsuario === u.id
                      ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Avatar className="size-4">
                    <AvatarImage src={u.fotoUrl || undefined} />
                    <AvatarFallback className="text-[9px]">{u.nombre.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{u.nombre}</span>
                </button>
              ))}
            </div>
          )}

          {/* Búsqueda */}
          <div className="relative ml-auto w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar acción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-8 pl-8 text-xs bg-background/50 border-white/10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {cargando ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
            <Spinner className="size-6 text-primary" />
            <span className="text-sm">Cargando historial de acciones...</span>
          </div>
        ) : accionesFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-2">
            <Filter className="size-8 opacity-30" />
            <p className="text-sm font-medium">No se encontraron acciones registradas con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 overflow-x-auto">
            {accionesFiltradas.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors hover:bg-white/[0.02]"
              >
                {/* Info principal */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-card border border-white/10 shadow-sm">
                    {getTipoIcon(item.tipo)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTipoBadge(item.tipo)}
                      <span className="font-heading font-medium text-sm text-foreground truncate">
                        {item.titulo}
                      </span>
                      {item.estado === "revertida" && (
                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                          Revertida
                        </Badge>
                      )}
                    </div>

                    {item.subtitulo && (
                      <p className="text-xs text-muted-foreground truncate">{item.subtitulo}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                      {/* Miembro involucrado */}
                      <div className="flex items-center gap-1.5">
                        <Avatar className="size-4 ring-1 ring-white/10">
                          <AvatarImage src={item.usuario.fotoUrl || undefined} />
                          <AvatarFallback className="text-[9px]">{item.usuario.nombre.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground/90">{item.usuario.nombre}</span>
                      </div>

                      {/* Fecha */}
                      <span>{formatearFecha(item.fecha)}</span>

                      {/* Detalles: puntos / estrellas / xp */}
                      {typeof item.detalles.puntos === "number" && item.detalles.puntos > 0 && (
                        <span className="text-amber-400 font-medium">+{item.detalles.puntos} pts</span>
                      )}
                      {typeof item.detalles.xp === "number" && item.detalles.xp > 0 && (
                        <span className="text-sky-400 font-medium">+{item.detalles.xp} XP</span>
                      )}
                      {typeof item.detalles.estrellas === "number" && item.detalles.estrellas > 0 && (
                        <span className="text-yellow-400 font-medium">+{item.detalles.estrellas} ⭐</span>
                      )}

                      {/* Actor si existe */}
                      {item.actor && (
                        <span className="text-muted-foreground/80">Por: {item.actor.nombre}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón de acción */}
                <div className="flex items-center self-end sm:self-center shrink-0">
                  {item.revertible ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAccionARevertir(item)}
                      className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                    >
                      <RotateCcw className="size-3.5" />
                      Revertir
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic px-2">
                      {item.estado === "revertida" ? "Ya revertida" : "No reversible"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de confirmación para revertir */}
      {accionARevertir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md border-amber-500/30 bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  ¿Revertir esta acción?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estás a punto de revertir:{" "}
                  <strong className="text-foreground">{accionARevertir.titulo}</strong> correspondiente a{" "}
                  <strong className="text-foreground">{accionARevertir.usuario.nombre}</strong>.
                </p>
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                  <p>• Los puntos, estrellas o beneficios otorgados serán descontados del balance del usuario.</p>
                  <p>• La acción volverá al estado pendiente o cancelado según corresponda.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAccionARevertir(null)}
                disabled={procesandoReversion}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmarReversion}
                disabled={procesandoReversion}
                className="gap-2"
              >
                {procesandoReversion ? <Spinner className="size-3.5" /> : <RotateCcw className="size-3.5" />}
                Confirmar reversión
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
