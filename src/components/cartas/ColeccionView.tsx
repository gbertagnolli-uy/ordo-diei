"use client";

import React, { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  Search,
  Lock,
  Sparkles,
  Flame,
  Award,
  Filter,
  ShoppingBag,
  ShieldCheck,
  Star,
  Orbit,
  LayoutGrid,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty";
import { CartaVista } from "@/components/cartas/CartaVista";
import { AlbumDomo } from "@/components/cartas/AlbumDomo";
import { TiendaCartasView } from "@/components/cartas/TiendaCartasView";
import { BannerEventosCartas } from "@/components/cartas/BannerEventosCartas";
import { ModalAperturaSobre, type ResultadoCompraSobre, type CartaAfectadaCompra } from "@/components/cartas/ModalAperturaSobre";
import { BordeReclamable } from "@/components/cartas/BordeReclamable";
import { useReclamoCarta, claveReclamo } from "@/components/cartas/useReclamoCarta";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { CartaListada } from "@/lib/cartas/server";
import type { GradoCarta } from "@/lib/cartas/economia";

interface ColeccionViewProps {
  inicial: {
    cartas: CartaListada[];
    usuario: {
      availablePoints: number;
      incienso: number;
      stars: number;
      xp: number;
      descuentoPct: number;
    };
  };
  rolFamiliar?: string | null;
}

export function ColeccionView({ inicial, rolFamiliar }: ColeccionViewProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const tabInicial = tabParam === "tienda" || tabParam === "album" ? tabParam : "coleccion";

  const [tab, setTab] = useState<string>(tabInicial);
  const [vistaAlbum, setVistaAlbum] = useState<"normal" | "3d">(searchParams?.get("vista") === "3d" ? "3d" : "normal");
  const [busqueda, setBusqueda] = useState<string>("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todas");
  const [rarezaFiltro, setRarezaFiltro] = useState<string>("Todas");
  const [gradoFiltro, setGradoFiltro] = useState<string>("Todos");

  const [cartas, setCartas] = useState<CartaListada[]>(inicial.cartas);
  const [usuario, setUsuario] = useState(inicial.usuario);
  const [modalAperturaOpen, setModalAperturaOpen] = useState<boolean>(false);
  const [resultadoApertura, setResultadoApertura] = useState<ResultadoCompraSobre | null>(null);

  const handleCompraExitosa = (resultado: ResultadoCompraSobre) => {
    setResultadoApertura(resultado);
    setModalAperturaOpen(true);

    if (resultado.cartasAfectadas && Array.isArray(resultado.cartasAfectadas)) {
      setCartas((prev) =>
        prev.map((c) => {
          const afectada = resultado.cartasAfectadas.find(
            (a: CartaAfectadaCompra) => a.cartaId === c.id || a.cartaClave === c.clave
          );
          if (afectada) {
            return {
              ...c,
              fragmentos: afectada.fragmentosDespues,
              desbloqueada: Boolean(afectada.desbloquea || c.desbloqueada),
              grado: afectada.gradoDespues as GradoCarta,
              reclamable: Boolean(afectada.reclamable),
              porcentaje: Math.floor((afectada.fragmentosDespues / c.fragmentosRequeridos) * 100),
            };
          }
          return c;
        })
      );
    }
  };

  const recargarCartas = () => {
    fetch("/api/cartas")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setCartas(data.cartas);
          setUsuario(data.usuario);
        }
      })
      .catch(() => {});
  };

  const { reclamar, reclamando, modal: modalReclamo } = useReclamoCarta(recargarCartas);

  // D20/D21: borde eléctrico en toda carta reclamable (grado alcanzado o fiesta de hoy)
  const marcoCarta = (carta: CartaListada, contenido: ReactNode) => (
    <BordeReclamable activo={carta.reclamable || carta.fiestaHoy} radio={8}>
      {contenido}
    </BordeReclamable>
  );

  // El grado se reclama acá; la fiesta, en el aviso de arriba (un solo botón por reclamo)
  const accionReclamo = (carta: CartaListada) => {
    if (carta.reclamable && carta.id) {
      const enCurso = reclamando === claveReclamo({ tipo: "grado", cartaId: carta.id });
      return (
        <Button
          type="button"
          size="sm"
          onClick={() => reclamar({ tipo: "grado", cartaId: carta.id! })}
          disabled={enCurso}
          className="h-7 gap-1 text-xs bg-amber-500 text-amber-950 hover:bg-amber-600"
        >
          <Sparkles className="size-3.5" />
          {enCurso
            ? "Reclamando..."
            : TEXTOS_CARTAS.reclamos.reclamarGrado(
                carta.desbloqueada ? TEXTOS_CARTAS.gradosRomanos[carta.gradoDisponible] : ""
              )}
        </Button>
      );
    }
    if (carta.fiestaHoy) {
      return (
        <Badge variant="outline" className="justify-center text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10">
          {TEXTOS_CARTAS.reclamos.fiestaHoy}
        </Badge>
      );
    }
    return null;
  };

  const handleActualizarSaldo = (nuevoPuntos: number, nuevoIncienso: number, nuevasEstrellas?: number) => {
    setUsuario((previo) => ({
      ...previo,
      availablePoints: nuevoPuntos,
      incienso: nuevoIncienso,
      stars: nuevasEstrellas ?? previo.stars,
    }));
  };

  // Estadísticas generales
  const totalCartas = cartas.length;
  const totalDesbloqueadas = useMemo(
    () => cartas.filter((c) => c.desbloqueada).length,
    [cartas]
  );

  // Filtrado de cartas
  const cartasFiltradas = useMemo(() => {
    return cartas.filter((c) => {
      // Búsqueda por texto
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideNombre = c.nombre.toLowerCase().includes(query);
        const coincideSubtitulo = c.subtitulo?.toLowerCase().includes(query) ?? false;
        if (!coincideNombre && !coincideSubtitulo) return false;
      }

      // Filtro por categoría
      if (categoriaFiltro !== "Todas" && c.categoria !== categoriaFiltro) {
        return false;
      }

      // Filtro por rareza
      if (rarezaFiltro !== "Todas" && c.rareza !== rarezaFiltro) {
        return false;
      }

      // Filtro por grado
      if (gradoFiltro !== "Todos") {
        const gradoNum = Number(gradoFiltro);
        if (c.grado !== gradoNum) return false;
      }

      return true;
    });
  }, [cartas, busqueda, categoriaFiltro, rarezaFiltro, gradoFiltro]);

  // Colección: solo las consagradas (desbloqueadas)
  const coleccionDesbloqueadas = useMemo(
    () => cartasFiltradas.filter((c) => c.desbloqueada),
    [cartasFiltradas]
  );

  // En camino: las que tienen fragmentos pero aún no se desbloquearon
  const coleccionEnCamino = useMemo(
    () => cartasFiltradas.filter((c) => !c.desbloqueada && c.fragmentos > 0),
    [cartasFiltradas]
  );

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    categoriaFiltro !== "Todas" ||
    rarezaFiltro !== "Todas" ||
    gradoFiltro !== "Todos";

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaFiltro("Todas");
    setRarezaFiltro("Todas");
    setGradoFiltro("Todos");
  };

  return (
    <div className="flex flex-col">
      <PageHeader group="Colección" title="Cartas" />
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Encabezado Principal y Recursos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="size-6 text-primary" />
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Cartas Católicas
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Venerá a los santos, contemplá los misterios y descubrí la herencia viva de la Santa Iglesia.
          </p>
        </div>

        {/* Recursos del Usuario */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-card-foreground shadow-xs">
            <Award className="size-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Puntos:</span>
            <span className="text-sm font-semibold tabular-nums">
              {usuario.availablePoints}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-card-foreground shadow-xs">
            <Flame className="size-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Incienso:</span>
            <span className="text-sm font-semibold tabular-nums">
              {usuario.incienso}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-card-foreground shadow-xs">
            <Star className="size-4 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Estrellas:</span>
            <span className="text-sm font-semibold tabular-nums">
              {usuario.stars}
            </span>
          </div>
        </div>
      </div>

      {/* Aviso de fiesta litúrgica y cumpleaños del día */}
      <BannerEventosCartas className="mb-2" onReclamoExitoso={recargarCartas} />

      {/* Selector de Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="coleccion" className="flex items-center gap-2">
              <span>Mi colección</span>
              <Badge variant="secondary" className="px-1.5 py-0 text-xs tabular-nums">
                {totalDesbloqueadas}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="album" className="flex items-center gap-2">
              <span>Álbum</span>
              <Badge variant="outline" className="px-1.5 py-0 text-xs tabular-nums">
                {totalDesbloqueadas}/{totalCartas}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tienda" className="flex items-center gap-2">
              <ShoppingBag className="size-3.5" />
              <span>Tienda</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            {(rolFamiliar === "Padre" || rolFamiliar === "Madre") && (
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Link href="/dashboard/cartas/admin">
                  <ShieldCheck className="size-3.5 text-amber-500" />
                  <span>Administrar</span>
                </Link>
              </Button>
            )}

            <div className="text-xs text-muted-foreground flex items-center gap-1 sm:self-center">
              <span>Progreso del Álbum:</span>
              <span className="font-medium text-foreground">
                {Math.round((totalDesbloqueadas / (totalCartas || 1)) * 100)} %
              </span>
              <span className="text-muted-foreground/60">
                ({totalDesbloqueadas} de {totalCartas} descubiertas)
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 bg-muted/40 rounded-xl border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar santo, misterio o tema..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro Categoría */}
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            >
              <option value="Todas">Categoría: Todas</option>
              <option value="Santo">Santos</option>
              <option value="Misterio">Misterios del Rosario</option>
              <option value="Angel">Ángeles y Arcángeles</option>
              <option value="Tema">Temas Centrales</option>
            </select>

            {/* Filtro Rareza */}
            <select
              value={rarezaFiltro}
              onChange={(e) => setRarezaFiltro(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            >
              <option value="Todas">Rareza: Todas</option>
              <option value="Comun">Común</option>
              <option value="Buena">Buena</option>
              <option value="Perfecta">Perfecta</option>
              <option value="Celestial">Celestial</option>
            </select>

            {/* Filtro Grado */}
            <select
              value={gradoFiltro}
              onChange={(e) => setGradoFiltro(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            >
              <option value="Todos">Grado: Todos</option>
              <option value="0">Bloqueadas (Grado 0)</option>
              <option value="1">Grado I (Desbloqueada)</option>
              <option value="2">Grado II (Venerada)</option>
              <option value="3">Grado III (Iluminada)</option>
              <option value="4">Grado IV (Gloriosa)</option>
            </select>

            {hayFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="text-xs h-9 text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* PESTAÑA: MI COLECCIÓN                                        */}
        {/* ============================================================ */}
        <TabsContent value="coleccion" className="mt-6 flex flex-col gap-8">
          {/* Sección 1: En Camino (cartas con progreso pero aún no consagradas) */}
          {coleccionEnCamino.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-500" />
                  <h2 className="font-heading text-lg font-semibold tracking-tight">
                    En camino ({coleccionEnCamino.length})
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  Cartas reuniendo fragmentos de gracia
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {coleccionEnCamino.map((carta) => {
                  const pct = Math.floor(
                    (carta.fragmentos / carta.fragmentosRequeridos) * 100
                  );
                  return (
                    <div key={carta.clave} className="flex flex-col gap-1.5">
                      <Link
                        href={`/dashboard/cartas/${carta.clave}`}
                        className="group flex flex-col gap-2 rounded-xl p-2 transition-all hover:bg-muted/50 border border-transparent hover:border-border"
                      >
                        {marcoCarta(carta, <div className="relative aspect-[63/88] w-full overflow-hidden rounded-lg">
                          <CartaVista
                            carta={carta}
                            modo="bloqueada"
                            grado={carta.grado}
                            fragmentos={carta.fragmentos}
                            ancho={240}
                            className="w-full h-full object-cover"
                          />
                        </div>)}
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-xs truncate group-hover:text-primary transition-colors">
                            {carta.nombre}
                          </span>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>
                              {carta.fragmentos}/{carta.fragmentosRequeridos}
                            </span>
                            <span className="font-medium text-foreground">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      </Link>
                      {accionReclamo(carta)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sección 2: Cartas Consagradas (Desbloqueadas) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Cartas consagradas ({coleccionDesbloqueadas.length})
              </h2>
            </div>

            {coleccionDesbloqueadas.length === 0 ? (
              <Empty className="border rounded-2xl bg-muted/20 py-16">
                <EmptyMedia variant="icon">
                  <Layers className="size-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Aún no tenés cartas consagradas</EmptyTitle>
                  <EmptyDescription>
                    {hayFiltrosActivos
                      ? "No hay cartas consagradas que coincidan con los filtros actuales."
                      : "Completá tus tareas y hábitos para ganar puntos, o abrí sobres para comenzar tu colección de santos y misterios."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {hayFiltrosActivos ? (
                    <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link href="/dashboard/cartas?tab=album">
                        Ver Álbum completo
                      </Link>
                    </Button>
                  )}
                </EmptyContent>
              </Empty>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {coleccionDesbloqueadas.map((carta) => {
                  const romano = TEXTOS_CARTAS.gradosRomanos[carta.grado] || "I";
                  return (
                    <div key={carta.clave} className="flex flex-col gap-1.5">
                      <Link
                        href={`/dashboard/cartas/${carta.clave}`}
                        className="group flex flex-col gap-2 rounded-xl p-2 transition-all hover:bg-muted/50 border border-transparent hover:border-border"
                      >
                        {marcoCarta(carta, <div className="relative aspect-[63/88] w-full overflow-hidden rounded-lg">
                          <CartaVista
                            carta={carta}
                            modo="plana"
                            grado={carta.grado}
                            fragmentos={carta.fragmentos}
                            ancho={240}
                            className="w-full h-full"
                          />
                        </div>)}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium text-xs truncate group-hover:text-primary transition-colors">
                              {carta.nombre}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0 font-serif font-bold uppercase shrink-0"
                            >
                              Grado {romano}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {carta.subtitulo || TEXTOS_CARTAS.rarezas[carta.rareza]}
                          </span>
                        </div>
                      </Link>
                      {accionReclamo(carta)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* PESTAÑA: ÁLBUM COMPLETO                                      */}
        {/* ============================================================ */}
        <TabsContent value="album" className="mt-6 flex flex-col gap-6">
          <div className="flex justify-end">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={vistaAlbum}
              onValueChange={(v) => v && setVistaAlbum(v as "normal" | "3d")}
              aria-label="Vista del álbum"
            >
              <ToggleGroupItem value="normal" className="gap-1.5 text-xs">
                <LayoutGrid className="size-3.5" />
                <span>Normal</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="3d" className="gap-1.5 text-xs">
                <Orbit className="size-3.5" />
                <span>Álbum 3D</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {cartasFiltradas.length > 0 && vistaAlbum === "3d" ? (
            <AlbumDomo cartas={cartasFiltradas} />
          ) : cartasFiltradas.length === 0 ? (
            <Empty className="border rounded-2xl bg-muted/20 py-16">
              <EmptyMedia variant="icon">
                <Filter className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No se encontraron cartas</EmptyTitle>
                <EmptyDescription>
                  No hay cartas en el catálogo que coincidan con los criterios de búsqueda seleccionados.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {cartasFiltradas.map((carta) => {
                const modo = carta.desbloqueada ? "plana" : "bloqueada";
                const romano = TEXTOS_CARTAS.gradosRomanos[carta.grado] || "I";

                return (
                  <div key={carta.clave} className="flex flex-col gap-1.5">
                    <Link
                      href={`/dashboard/cartas/${carta.clave}`}
                      className="group flex flex-col gap-2 rounded-xl p-2 transition-all hover:bg-muted/50 border border-transparent hover:border-border"
                    >
                      {marcoCarta(carta, <div className="relative aspect-[63/88] w-full overflow-hidden rounded-lg">
                        <CartaVista
                          carta={carta}
                          modo={modo}
                          grado={carta.grado}
                          fragmentos={carta.fragmentos}
                          ancho={240}
                          className="w-full h-full"
                        />
                      </div>)}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium text-xs truncate group-hover:text-primary transition-colors">
                            {carta.nombre}
                          </span>
                          {carta.desbloqueada ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0 font-serif font-bold uppercase shrink-0"
                            >
                              Grado {romano}
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 tabular-nums">
                              <Lock className="size-3" />
                              <span>
                                {carta.fragmentos}/{carta.fragmentosRequeridos}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {TEXTOS_CARTAS.rarezas[carta.rareza]} · {carta.categoria}
                        </span>
                      </div>
                    </Link>
                    {accionReclamo(carta)}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* PESTAÑA: TIENDA                                              */}
        {/* ============================================================ */}
        <TabsContent value="tienda" className="mt-6">
          <TiendaCartasView
            cartas={cartas}
            usuario={usuario}
            onCompraExitosa={handleCompraExitosa}
            onActualizarSaldo={handleActualizarSaldo}
          />
        </TabsContent>
      </Tabs>

      {modalReclamo}

      {/* Modal de Apertura Animado en 3 Etapas con Confeti */}
      <ModalAperturaSobre
        open={modalAperturaOpen}
        onOpenChange={setModalAperturaOpen}
        resultado={resultadoApertura}
        onAbrirOtro={() => {
          setModalAperturaOpen(false);
          setTab("tienda");
        }}
        onVerColeccion={() => {
          setModalAperturaOpen(false);
          setTab("coleccion");
        }}
      />
    </div>
    </div>
  );
}
