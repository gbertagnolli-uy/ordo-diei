"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { urlArte } from "@/lib/cartas/arte";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  Search,
  Plus,
  Pencil,
  Archive,
  Trash2,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { FormularioCartaAdmin } from "./FormularioCartaAdmin";
import type { CartaAdminItem } from "@/lib/cartas/server";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";

interface AdminCartasViewProps {
  cartasIniciales: CartaAdminItem[];
}

export function AdminCartasView({ cartasIniciales }: AdminCartasViewProps) {
  const [cartas, setCartas] = useState<CartaAdminItem[]>(cartasIniciales);
  const [modoFormulario, setModoFormulario] = useState<boolean>(false);
  const [cartaSeleccionada, setCartaSeleccionada] = useState<CartaAdminItem | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState<string>("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todas");
  const [rarezaFiltro, setRarezaFiltro] = useState<string>("Todas");
  const [origenFiltro, setOrigenFiltro] = useState<string>("Todos");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("Todas");

  const [cargandoAccion, setCargandoAccion] = useState<number | null>(null);
  const [cartaAEliminar, setCartaAEliminar] = useState<CartaAdminItem | null>(null);

  const cartasFiltradas = useMemo(() => {
    return cartas.filter((c) => {
      // Búsqueda por texto
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const matchNombre = c.nombre.toLowerCase().includes(query);
        const matchClave = c.clave.toLowerCase().includes(query);
        const matchSubtitulo = c.subtitulo?.toLowerCase().includes(query);
        if (!matchNombre && !matchClave && !matchSubtitulo) return false;
      }

      // Filtro por categoría
      if (categoriaFiltro !== "Todas" && c.categoria !== categoriaFiltro) {
        return false;
      }

      // Filtro por rareza
      if (rarezaFiltro !== "Todas" && c.rareza !== rarezaFiltro) {
        return false;
      }

      // Filtro por origen
      if (origenFiltro !== "Todos" && c.origen !== origenFiltro) {
        return false;
      }

      // Filtro por estado
      if (estadoFiltro === "Activas" && !c.activa) return false;
      if (estadoFiltro === "Archivadas" && c.activa) return false;

      return true;
    });
  }, [cartas, busqueda, categoriaFiltro, rarezaFiltro, origenFiltro, estadoFiltro]);

  // Manejar apertura de formulario para crear
  const abrirCreacion = () => {
    setCartaSeleccionada(null);
    setModoFormulario(true);
  };

  // Manejar apertura de formulario para editar
  const abrirEdicion = (c: CartaAdminItem) => {
    setCartaSeleccionada(c);
    setModoFormulario(true);
  };

  // Manejar guardado exitoso
  const manejarGuardado = (cartaGuardada: CartaAdminItem) => {
    setCartas((prev) => {
      const idx = prev.findIndex((c) => c.id === cartaGuardada.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = cartaGuardada;
        return copia;
      }
      return [cartaGuardada, ...prev];
    });
    setModoFormulario(false);
    setCartaSeleccionada(null);
    toast.success(`Carta "${cartaGuardada.nombre}" guardada con éxito. Ya está visible en el álbum de todos.`);
  };

  // Archivar o restaurar carta
  const alternarEstadoCarta = async (c: CartaAdminItem) => {
    try {
      setCargandoAccion(c.id);

      const nuevoEstado = !c.activa;
      const res = await fetch("/api/cartas/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: c.id,
          accion: nuevoEstado ? "restaurar" : "archivar",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar el estado");
      }

      setCartas((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, activa: nuevoEstado } : item))
      );

      toast.success(nuevoEstado ? `Carta "${c.nombre}" restaurada y visible en el álbum.` : `Carta "${c.nombre}" archivada (se conserva el progreso existente).`);
    } catch (err: unknown) {
      console.error("Error al archivar/restaurar:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
    } finally {
      setCargandoAccion(null);
    }
  };

  // Eliminar carta definitivamente
  const eliminarCarta = async (c: CartaAdminItem) => {
    try {
      setCargandoAccion(c.id);

      const res = await fetch(`/api/cartas/admin?id=${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar la carta");
      }

      setCartas((prev) => prev.filter((item) => item.id !== c.id));
      toast.success(`Carta "${c.nombre}" eliminada definitivamente.`);
    } catch (err: unknown) {
      console.error("Error al eliminar:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
    } finally {
      setCargandoAccion(null);
      setCartaAEliminar(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Barra de navegación superior */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-xs">
            <Link href="/dashboard/cartas">
              <ArrowLeft className="h-4 w-4" />
              Volver al Álbum
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <span className="font-serif font-bold text-lg text-foreground">
              Panel Administrativo de Cartas
            </span>
          </div>
        </div>

        {!modoFormulario && (
          <Button onClick={abrirCreacion} className="gap-2 shadow-xs">
            <Plus className="h-4 w-4" />
            Nueva Carta
          </Button>
        )}
      </div>

      {/* Si estamos en modo formulario, mostrar Formulario */}
      {modoFormulario ? (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <FormularioCartaAdmin
            cartaInicial={cartaSeleccionada}
            onGuardado={manejarGuardado}
            onCancelar={() => {
              setModoFormulario(false);
              setCartaSeleccionada(null);
            }}
          />
        </div>
      ) : (
        /* Vista de Listado de Cartas */
        <div className="flex flex-col gap-5">
          {/* Barra de Búsqueda y Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-muted/20 p-4 rounded-xl border border-border/60">
            {/* Buscador */}
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, slug..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Categoría */}
            <NativeSelect
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full h-9 text-xs"
            >
              <NativeSelectOption value="Todas">Categoría: Todas</NativeSelectOption>
              <NativeSelectOption value="Santo">Santos</NativeSelectOption>
              <NativeSelectOption value="Angel">Ángeles</NativeSelectOption>
              <NativeSelectOption value="Misterio">Misterios</NativeSelectOption>
              <NativeSelectOption value="Tema">Temas</NativeSelectOption>
              <NativeSelectOption value="Persona">Personas</NativeSelectOption>
            </NativeSelect>

            {/* Rareza */}
            <NativeSelect
              value={rarezaFiltro}
              onChange={(e) => setRarezaFiltro(e.target.value)}
              className="w-full h-9 text-xs"
            >
              <NativeSelectOption value="Todas">Rareza: Todas</NativeSelectOption>
              <NativeSelectOption value="Comun">Común</NativeSelectOption>
              <NativeSelectOption value="Buena">Buena</NativeSelectOption>
              <NativeSelectOption value="Perfecta">Perfecta</NativeSelectOption>
              <NativeSelectOption value="Celestial">Celestial</NativeSelectOption>
            </NativeSelect>

            {/* Origen */}
            <NativeSelect
              value={origenFiltro}
              onChange={(e) => setOrigenFiltro(e.target.value)}
              className="w-full h-9 text-xs"
            >
              <NativeSelectOption value="Todos">Origen: Todos</NativeSelectOption>
              <NativeSelectOption value="Sistema">Sistema</NativeSelectOption>
              <NativeSelectOption value="Manual">Manual</NativeSelectOption>
            </NativeSelect>

            {/* Estado */}
            <NativeSelect
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full h-9 text-xs"
            >
              <NativeSelectOption value="Todas">Estado: Todas</NativeSelectOption>
              <NativeSelectOption value="Activas">Solo Activas</NativeSelectOption>
              <NativeSelectOption value="Archivadas">Solo Archivadas</NativeSelectOption>
            </NativeSelect>
          </div>

          {/* Contador de resultados */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Mostrando <strong>{cartasFiltradas.length}</strong> de {cartas.length} cartas
            </span>
          </div>

          {/* Tabla Shadcn */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[70px]">Imagen</TableHead>
                  <TableHead>Nombre & Clave</TableHead>
                  <TableHead className="w-[110px]">Categoría</TableHead>
                  <TableHead className="w-[110px]">Rareza</TableHead>
                  <TableHead className="w-[110px]">Celebración</TableHead>
                  <TableHead className="w-[100px] text-center">Req.</TableHead>
                  <TableHead className="w-[110px] text-center">Origen</TableHead>
                  <TableHead className="w-[100px] text-center">Estado</TableHead>
                  <TableHead className="w-[160px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      No se encontraron cartas con los filtros especificados.
                    </TableCell>
                  </TableRow>
                ) : (
                  cartasFiltradas.map((c) => (
                    <TableRow key={c.id} className={!c.activa ? "opacity-60 bg-muted/10" : ""}>
                      {/* Miniatura */}
                      <TableCell className="p-2">
                        <div className="relative aspect-[63/88] w-12 overflow-hidden rounded-md border border-border/80 bg-muted">
                          {c.imagenUrl ? (
                            <Image
                              src={urlArte(c.imagenUrl)}
                              alt={c.nombre}
                              fill
                              sizes="50px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">
                              B/N
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Nombre, Subtítulo y Clave */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                            {c.nombre}
                            {c.editadaManual && (
                              <Badge variant="outline" className="text-[9px] py-0 h-4 border-amber-500/40 text-amber-600 dark:text-amber-400">
                                Editada
                              </Badge>
                            )}
                          </span>
                          {c.subtitulo && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {c.subtitulo}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">
                            {c.clave}
                          </span>
                        </div>
                      </TableCell>

                      {/* Categoría */}
                      <TableCell>
                        <Badge variant="secondary" className="text-[11px]">
                          {TEXTOS_CARTAS.categorias[c.categoria] || c.categoria}
                        </Badge>
                      </TableCell>

                      {/* Rareza */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium ${
                            c.rareza === "Comun"
                              ? "border-amber-700/30 text-amber-800 dark:text-amber-400"
                              : c.rareza === "Buena"
                              ? "border-sky-500/30 text-sky-700 dark:text-sky-400"
                              : c.rareza === "Perfecta"
                              ? "border-purple-500/30 text-purple-700 dark:text-purple-400"
                              : "border-amber-400 text-amber-500 dark:text-amber-300 font-bold"
                          }`}
                        >
                          {TEXTOS_CARTAS.rarezas[c.rareza] || c.rareza}
                        </Badge>
                      </TableCell>

                      {/* Celebración */}
                      <TableCell>
                        {c.celebracion ? (
                          <div className="flex items-center gap-1 text-xs font-mono text-foreground">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {c.celebracion}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </TableCell>

                      {/* Requeridos */}
                      <TableCell className="text-center font-mono text-xs">
                        {c.fragmentosRequeridos}
                      </TableCell>

                      {/* Origen */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] py-0 h-4">
                          {c.origen}
                        </Badge>
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="text-center">
                        {c.activa ? (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] bg-zinc-500/10 text-zinc-500 border-zinc-500/20">
                            Archivada
                          </Badge>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirEdicion(c)}
                            className="h-8 w-8 p-0"
                            title="Editar carta"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={cargandoAccion === c.id}
                            onClick={() => alternarEstadoCarta(c)}
                            className={`h-8 w-8 p-0 ${
                              c.activa ? "text-muted-foreground hover:text-destructive" : "text-emerald-600 hover:text-emerald-700"
                            }`}
                            title={c.activa ? "Archivar carta" : "Restaurar carta"}
                          >
                            {cargandoAccion === c.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : c.activa ? (
                              <Archive className="h-3.5 w-3.5" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={cargandoAccion === c.id}
                            onClick={() => setCartaAEliminar(c)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Eliminar carta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={!!cartaAEliminar} onOpenChange={(abierto) => !abierto && setCartaAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar &quot;{cartaAEliminar?.nombre}&quot;?</DialogTitle>
            <DialogDescription>
              Se borra definitivamente y se pierde el progreso de todos los usuarios en esta carta.
              Esto no se puede deshacer. Si solo querés ocultarla, usá Archivar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCartaAEliminar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={cargandoAccion !== null}
              onClick={() => cartaAEliminar && eliminarCarta(cartaAEliminar)}
            >
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
