"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, useSyncExternalStore } from "react";
import {
  Clock,
  Calendar,
  CalendarDays,
  Sparkles,
  RotateCcw,
  Plus,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  EtapaRutina,
  ConfiguracionRutina,
} from "@/lib/rutina/tipos";
import {
  obtenerEtapaActual,
  obtenerProximaEtapa,
  calcularProgresoEtapa,
  posponerDesdeEtapa,
  extenderEtapaActiva,
  filtrarEtapasPorDia,
  obtenerEtapaAnterior,
  obtenerEtapaSiguiente,
  avanzarEtapaAhora,
  retrocederEtapaAhora,
} from "@/lib/rutina/calculadorHorarios";
import {
  obtenerConfiguracionRutina,
  guardarConfiguracionRutina,
  restablecerRutinaDefault,
} from "@/lib/rutina/storageRutina";
import {
  reproducirAlarma,
  solicitarPermisoNotificacion,
  emitirNotificacion,
  prepararAudio,
  TipoSonidoRutina,
} from "@/lib/rutina/audioRutina";
import { TemporizadorDisco } from "./TemporizadorDisco";
import { TimelineDiario } from "./TimelineDiario";
import { RutinaSemanalView } from "./RutinaSemanalView";
import { RutinaMensualView } from "./RutinaMensualView";
import { EditorEtapaModal } from "./EditorEtapaModal";
import { BarraAlarmaActiva } from "./BarraAlarmaActiva";

interface RutinaClientPageProps {
  currentUser?: {
    id?: number;
    nombre?: string;
    rolFamiliar?: string;
  } | null;
}

/** Fecha local en formato YYYY-MM-DD (clave de los ajustes y cumplimientos del día). */
function claveDia(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${m}-${d}`;
}

const sinSuscripcion = () => () => {};

/**
 * Todo el tablero depende de la hora y la configuración del navegador: se dibuja solo en el
 * cliente para que el HTML del servidor (otra hora y zona horaria) no choque al hidratar.
 */
export function RutinaClientPage(props: RutinaClientPageProps) {
  const enCliente = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  if (!enCliente) {
    return (
      <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="h-9 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="mt-6 h-96 animate-pulse rounded-3xl bg-muted/60" />
      </div>
    );
  }
  return <RutinaContenido {...props} />;
}

function RutinaContenido({ currentUser }: RutinaClientPageProps) {
  const esPadre =
    currentUser?.rolFamiliar === "Padre" || currentUser?.rolFamiliar === "Madre";

  // Este componente solo se monta en el cliente (ver RutinaClientPage): se lee localStorage directo
  const [config, setConfig] = useState<ConfiguracionRutina>(() => obtenerConfiguracionRutina());
  const configRef = useRef<ConfiguracionRutina>(config);
  const [horaActual, setHoraActual] = useState<Date>(() => new Date());
  // Instante en que se pausó: mientras exista, todo el tablero queda congelado en ese momento
  const [pausadoDesde, setPausadoDesde] = useState<Date | null>(null);
  const [esFullscreen, setEsFullscreen] = useState(false);

  // Etapa con alarma activa para el aviso flotante
  const [alarmaActivaEtapa, setAlarmaActivaEtapa] = useState<EtapaRutina | null>(null);
  const ultimaEtapaIdAlarmaRef = useRef<string | null>(null);

  // Estado del modal editor
  const [modalEditorAbierto, setModalEditorAbierto] = useState(false);
  const [etapaAEditar, setEtapaAEditar] = useState<EtapaRutina | null>(null);

  // Tab activo
  const [tabActivo, setTabActivo] = useState("vivo");

  const estaPausado = pausadoDesde !== null;
  // Reloj que gobierna etapa, cuenta regresiva y termómetro (congelado en pausa)
  const horaEfectiva = pausadoDesde ?? horaActual;
  const hoyClave = claveDia(horaEfectiva);

  /** Aplica una nueva configuración: estado, referencia y persistencia en un solo punto. */
  const aplicarConfig = useCallback((next: ConfiguracionRutina) => {
    configRef.current = next;
    setConfig(next);
    guardarConfiguracionRutina(next);
  }, []);

  const actualizarConfig = useCallback(
    (fn: (prev: ConfiguracionRutina) => ConfiguracionRutina) => {
      aplicarConfig(fn(configRef.current));
    },
    [aplicarConfig]
  );

  // Mantener sincronizada la config si otra parte de la app la guarda
  useEffect(() => {
    const onActualizada = (e: Event) => {
      const customEvent = e as CustomEvent<ConfiguracionRutina>;
      if (customEvent.detail) {
        configRef.current = customEvent.detail;
        setConfig(customEvent.detail);
      }
    };

    window.addEventListener("rutina-actualizada", onActualizada);
    return () => window.removeEventListener("rutina-actualizada", onActualizada);
  }, []);

  // Los navegadores bloquean el audio hasta que hay un gesto del usuario: lo habilitamos
  // en la primera interacción para que la campana pueda sonar sola al cambiar de etapa.
  useEffect(() => {
    const preparar = () => prepararAudio();
    window.addEventListener("pointerdown", preparar, { once: true });
    window.addEventListener("keydown", preparar, { once: true });
    return () => {
      window.removeEventListener("pointerdown", preparar);
      window.removeEventListener("keydown", preparar);
    };
  }, []);

  // Reloj en vivo (1 s); se corrige al volver a la pestaña porque los navegadores frenan los timers
  useEffect(() => {
    const tick = () => setHoraActual(new Date());
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  // Horario efectivo de hoy: el ajustado solo para este día o, si no hay, la rutina base
  const etapas = useMemo(
    () => (config.ajusteDia?.fecha === hoyClave ? config.ajusteDia.etapas : config.etapas),
    [config.ajusteDia, config.etapas, hoyClave]
  );
  const etapasDeHoy = useMemo(
    () => filtrarEtapasPorDia(etapas, horaEfectiva),
    [etapas, horaEfectiva]
  );

  const completadasIds = useMemo(
    () => new Set(config.cumplidasDia?.fecha === hoyClave ? config.cumplidasDia.ids : []),
    [config.cumplidasDia, hoyClave]
  );

  const guardarAjusteDia = (nuevas: EtapaRutina[]) => {
    actualizarConfig((prev) => ({ ...prev, ajusteDia: { fecha: hoyClave, etapas: nuevas } }));
  };

  // Cálculo de la etapa actual y próxima
  const { etapa: etapaActual } = useMemo(
    () => obtenerEtapaActual(etapas, horaEfectiva),
    [etapas, horaEfectiva]
  );
  const { etapa: proximaEtapa, restanteSeg: segHastaProxima } = useMemo(
    () => obtenerProximaEtapa(etapas, horaEfectiva),
    [etapas, horaEfectiva]
  );
  const etapaAnterior = useMemo(
    () => obtenerEtapaAnterior(etapas, horaEfectiva),
    [etapas, horaEfectiva]
  );
  const etapaSiguiente = useMemo(
    () => obtenerEtapaSiguiente(etapas, horaEfectiva),
    [etapas, horaEfectiva]
  );

  // Cuenta regresiva continua; en pausa horaEfectiva no avanza y el disco queda quieto
  const progreso = useMemo(() => {
    if (!etapaActual) {
      return {
        totalSeg: segHastaProxima > 0 ? segHastaProxima : 3600,
        transcurridoSeg: 0,
        restanteSeg: segHastaProxima > 0 ? segHastaProxima : 0,
        porcentaje: 0,
        porcentajeRestante: 100,
        ratioRestante: 1.0,
        fase: "verde" as const,
      };
    }
    return calcularProgresoEtapa(etapaActual, horaEfectiva);
  }, [etapaActual, horaEfectiva, segHastaProxima]);

  // Detector de alarmas por transición de etapa
  useEffect(() => {
    if (!etapaActual) return;

    // Primera lectura (o recarga de la página): solo registramos la etapa, sin sonar
    if (ultimaEtapaIdAlarmaRef.current === null) {
      ultimaEtapaIdAlarmaRef.current = etapaActual.id;
      return;
    }

    if (etapaActual.id !== ultimaEtapaIdAlarmaRef.current) {
      ultimaEtapaIdAlarmaRef.current = etapaActual.id;

      if (etapaActual.alarmaSonora && config.sonidoHabilitado) {
        reproducirAlarma(config.tipoSonido, config.volumen);
      }
      if (etapaActual.alarmaSonora) {
        // Reacción a un cambio de etapa provocado por el reloj (sistema externo)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAlarmaActivaEtapa(etapaActual);
        if (config.notificacionesNavegador) {
          emitirNotificacion(etapaActual.titulo, {
            body: `${etapaActual.horaInicio} – ${etapaActual.horaFin}`,
          });
        }
      }
    }
  }, [
    etapaActual,
    config.sonidoHabilitado,
    config.tipoSonido,
    config.volumen,
    config.notificacionesNavegador,
  ]);

  // El aviso solo tiene sentido mientras esa etapa sigue vigente
  const avisoVisible =
    alarmaActivaEtapa && etapaActual?.id === alarmaActivaEtapa.id ? alarmaActivaEtapa : null;

  // Pausa real: congela el reloj del tablero; al reanudar, el día se corre lo que duró la pausa
  const handleTogglePausa = () => {
    if (!pausadoDesde) {
      setPausadoDesde(new Date());
      return;
    }
    const segPausados = Math.round((Date.now() - pausadoDesde.getTime()) / 1000);
    if (segPausados >= 30 && etapaActual) {
      const minutosShift = Math.max(1, Math.round(segPausados / 60));
      guardarAjusteDia(extenderEtapaActiva(etapas, etapaActual.id, minutosShift));
    }
    setPausadoDesde(null);
    setHoraActual(new Date());
  };

  // +5 min: alarga la etapa actual y corre las siguientes del día
  const handleExtenderTiempo = () => {
    if (!etapaActual) return;
    guardarAjusteDia(extenderEtapaActiva(etapas, etapaActual.id, 5));
  };

  // Navegación manual entre etapas. Opera con la hora real (sale de la pausa sin desplazar)
  // y marca la nueva etapa como "ya avisada" para que no suene la campana ni salte el aviso.
  const navegarEtapa = (
    mover: (e: EtapaRutina[], f: Date) => EtapaRutina[],
    destino: EtapaRutina | null
  ) => {
    if (!destino) return;
    const ahora = new Date();
    const nuevas = mover(etapas, ahora);
    if (nuevas === etapas) return;
    ultimaEtapaIdAlarmaRef.current = destino.id;
    setAlarmaActivaEtapa(null);
    setPausadoDesde(null);
    setHoraActual(ahora);
    guardarAjusteDia(nuevas);
  };

  const handleAvanzarEtapa = () => navegarEtapa(avanzarEtapaAhora, etapaSiguiente);
  const handleRetrocederEtapa = () => navegarEtapa(retrocederEtapaAhora, etapaAnterior);

  // Posponer desde el aviso: la etapa previa se prolonga y la nueva (y todas las siguientes
  // del día) se corren. Solo afecta a hoy; la rutina base no cambia.
  const handlePosponerDesdeAlarma = (minutos: number) => {
    if (!alarmaActivaEtapa) return;
    const idx = etapasDeHoy.findIndex((e) => e.id === alarmaActivaEtapa.id);
    const previa = idx > 0 ? etapasDeHoy[idx - 1] : null;
    // La etapa previa vuelve a ser la vigente: no debe volver a sonar
    if (previa) ultimaEtapaIdAlarmaRef.current = previa.id;
    guardarAjusteDia(posponerDesdeEtapa(etapas, alarmaActivaEtapa.id, minutos, true));
    setAlarmaActivaEtapa(null);
  };

  const handleToggleCompletada = (id: string) => {
    actualizarConfig((prev) => {
      const actuales = new Set(prev.cumplidasDia?.fecha === hoyClave ? prev.cumplidasDia.ids : []);
      if (actuales.has(id)) actuales.delete(id);
      else actuales.add(id);
      return { ...prev, cumplidasDia: { fecha: hoyClave, ids: [...actuales] } };
    });
  };

  // La rutina base cambió (editor): el ajuste de hoy deja de ser válido
  const handleGuardarEtapa = (etapa: EtapaRutina) => {
    actualizarConfig((prev) => {
      const existe = prev.etapas.some((e) => e.id === etapa.id);
      const nuevasEtapas = existe
        ? prev.etapas.map((e) => (e.id === etapa.id ? etapa : e))
        : [...prev.etapas, etapa];
      nuevasEtapas.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
      return { ...prev, etapas: nuevasEtapas, ajusteDia: null };
    });
  };

  const handleEliminarEtapa = (id: string) => {
    actualizarConfig((prev) => ({
      ...prev,
      etapas: prev.etapas.filter((e) => e.id !== id),
      ajusteDia: null,
    }));
  };

  const handleRestablecerDefault = () => {
    if (
      confirm(
        "¿Deseas restablecer toda la rutina familiar a los horarios oficiales por defecto?"
      )
    ) {
      const rest = restablecerRutinaDefault();
      configRef.current = rest;
      setConfig(rest);
    }
  };

  const handleToggleSonido = () => {
    actualizarConfig((prev) => ({ ...prev, sonidoHabilitado: !prev.sonidoHabilitado }));
  };

  const handleChangeTipoSonido = (tipo: TipoSonidoRutina) => {
    actualizarConfig((prev) => ({ ...prev, tipoSonido: tipo }));
    reproducirAlarma(tipo, config.volumen);
  };

  const handleChangeVolumen = (vol: number) => {
    actualizarConfig((prev) => ({ ...prev, volumen: vol }));
  };

  const handleProbarSonido = () => {
    reproducirAlarma(config.tipoSonido, config.volumen);
  };

  const handleToggleNotificaciones = async () => {
    if (config.notificacionesNavegador) {
      actualizarConfig((prev) => ({ ...prev, notificacionesNavegador: false }));
      return;
    }
    const permitido = await solicitarPermisoNotificacion();
    actualizarConfig((prev) => ({ ...prev, notificacionesNavegador: permitido }));
  };

  const handleToggleMeta = (id: string) => {
    actualizarConfig((prev) => ({
      ...prev,
      metasMensuales: prev.metasMensuales.map((m) =>
        m.id === id ? { ...m, completada: !m.completada } : m
      ),
    }));
  };

  const handleAgregarMeta = (titulo: string, virtud: string, descripcion: string) => {
    actualizarConfig((prev) => ({
      ...prev,
      metasMensuales: [
        ...prev.metasMensuales,
        {
          id: `meta-${Date.now()}`,
          mes: new Date().toISOString().slice(0, 7),
          titulo,
          virtudDelMes: virtud || undefined,
          descripcion: descripcion || undefined,
          completada: false,
        },
      ],
    }));
  };

  const abrirEditor = (etapa: EtapaRutina | null) => {
    // Se edita siempre la versión base, no la desplazada por los ajustes de hoy
    setEtapaAEditar(etapa ? config.etapas.find((e) => e.id === etapa.id) ?? etapa : null);
    setModalEditorAbierto(true);
  };

  // Lista "próximas etapas": desde la actual (o la próxima si hay hueco) hasta cerrar el día
  const proximasHoy = useMemo(() => {
    if (etapaActual) {
      return etapasDeHoy.slice(etapasDeHoy.findIndex((e) => e.id === etapaActual.id));
    }
    if (proximaEtapa) {
      return etapasDeHoy.filter((e) => e.horaInicio >= proximaEtapa.horaInicio);
    }
    return [];
  }, [etapasDeHoy, etapaActual, proximaEtapa]);

  const toggleFullscreen = () => setEsFullscreen((v) => !v);

  // Mismas props para el temporizador en la tarjeta y en modo enfoque
  const renderTemporizador = (enfoque: boolean) => (
    <TemporizadorDisco
      etapaActual={etapaActual}
      proximaEtapa={proximaEtapa}
      etapaAnterior={etapaAnterior}
      restanteSeg={progreso.restanteSeg}
      totalSeg={progreso.totalSeg}
      ratioRestante={progreso.ratioRestante}
      fase={progreso.fase}
      estaPausado={estaPausado}
      onTogglePausa={handleTogglePausa}
      onExtenderTiempo={handleExtenderTiempo}
      onAvanzarEtapa={handleAvanzarEtapa}
      onRetrocederEtapa={handleRetrocederEtapa}
      puedeAvanzar={!!etapaSiguiente}
      puedeRetroceder={!!etapaAnterior}
      esFullscreen={enfoque}
      onToggleFullscreen={toggleFullscreen}
      sonidoHabilitado={config.sonidoHabilitado}
      onToggleSonido={handleToggleSonido}
      tipoSonido={config.tipoSonido}
      onChangeTipoSonido={handleChangeTipoSonido}
      volumen={config.volumen}
      onChangeVolumen={handleChangeVolumen}
      onProbarSonido={handleProbarSonido}
      notificacionesActivas={config.notificacionesNavegador}
      onToggleNotificaciones={handleToggleNotificaciones}
    />
  );

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Alerta / Banner de inicio de etapa */}
      <BarraAlarmaActiva
        etapa={avisoVisible}
        onCerrar={() => setAlarmaActivaEtapa(null)}
        onPosponer={handlePosponerDesdeAlarma}
      />

      {/* Modo Enfoque: pantalla completa real, disponible desde cualquier pestaña */}
      {esFullscreen && renderTemporizador(true)}

      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Rutina y Horarios
            </h1>
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 border-primary/30 text-primary font-medium"
            >
              Familiar
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión integral del ritmo diario, semanal y mensual del hogar.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2 flex-wrap">
          {esPadre && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => abrirEditor(null)}
                className="h-9 rounded-xl gap-1.5 text-xs font-semibold"
              >
                <Plus className="size-4" />
                Nueva Etapa
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestablecerDefault}
                className="h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground"
                title="Restablecer la rutina original de 28 etapas"
              >
                <RotateCcw className="size-3.5 mr-1" />
                Restablecer
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            className="h-9 rounded-xl gap-1.5 text-xs font-medium"
            title="Modo Enfoque: temporizador a pantalla completa (tablet o pared)"
          >
            <Maximize2 className="size-4" />
            <span className="hidden sm:inline">Modo Enfoque</span>
          </Button>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <Tabs value={tabActivo} onValueChange={setTabActivo} className="space-y-6">
        <TabsList className="grid grid-cols-4 sm:w-[480px] h-11 p-1 rounded-2xl bg-muted/60">
          <TabsTrigger value="vivo" className="rounded-xl text-xs font-semibold gap-1.5">
            <Clock className="size-3.5" />
            <span>En Vivo</span>
          </TabsTrigger>
          <TabsTrigger value="diaria" className="rounded-xl text-xs font-semibold gap-1.5">
            <Calendar className="size-3.5" />
            <span>Diaria</span>
          </TabsTrigger>
          <TabsTrigger value="semanal" className="rounded-xl text-xs font-semibold gap-1.5">
            <CalendarDays className="size-3.5" />
            <span>Semanal</span>
          </TabsTrigger>
          <TabsTrigger value="mensual" className="rounded-xl text-xs font-semibold gap-1.5">
            <Sparkles className="size-3.5" />
            <span>Mensual</span>
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA 1: HORARIOS EN VIVO (TEMPORIZADOR + CUENTA REGRESIVA) */}
        <TabsContent value="vivo" className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda: Disco Time-Timer Visual */}
            <div className="lg:col-span-6 flex flex-col items-center">
              {esFullscreen ? (
                <div className="flex min-h-[280px] w-full items-center justify-center rounded-3xl border border-dashed text-sm text-muted-foreground">
                  Modo Enfoque activo
                </div>
              ) : (
                renderTemporizador(false)
              )}
            </div>

            {/* Columna Derecha: Vista previa de próximas etapas de hoy */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-3xl border shadow-xs bg-card/90">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      Próximas etapas para hoy
                    </CardTitle>
                    <span className="text-xs font-mono font-medium text-muted-foreground">
                      {horaActual.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2 max-h-[460px] overflow-y-auto">
                  {proximasHoy
                    .slice(0, 7)
                    .map((etapa) => (
                      <div
                        key={etapa.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs gap-3 transition-colors ${
                          etapa.id === etapaActual?.id
                            ? "bg-primary/10 border-primary/30 font-semibold shadow-xs"
                            : "bg-muted/30 border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="font-mono text-muted-foreground shrink-0 font-medium">
                            {etapa.horaInicio}
                          </span>
                          <span className="truncate">{etapa.titulo}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                          {etapa.duracionMin} min
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Guía pedagógica rápida sobre el ritmo familiar */}
              <div className="p-4 rounded-2xl border bg-muted/20 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <p>
                  <strong>Consejo de orden familiar:</strong> Los bloques con horario previsible
                  evitan la fatiga de decisión en los niños y permiten transiciones pacíficas con
                  la campana sonora sin discusiones.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PESTAÑA 2: RUTINA DIARIA COMPLETA (08:00 - 22:00) */}
        <TabsContent value="diaria" className="animate-in fade-in duration-300">
          <TimelineDiario
            etapas={etapas}
            etapaActualId={etapaActual?.id || null}
            proximaEtapaId={proximaEtapa?.id || null}
            horaActual={horaEfectiva}
            completadasIds={completadasIds}
            onToggleCompletada={handleToggleCompletada}
            onEditarEtapa={abrirEditor}
            onEliminarEtapa={handleEliminarEtapa}
            onCrearEtapa={() => abrirEditor(null)}
            esPadre={esPadre}
          />
        </TabsContent>

        {/* PESTAÑA 3: RUTINA SEMANAL */}
        <TabsContent value="semanal" className="animate-in fade-in duration-300">
          <RutinaSemanalView
            etapas={config.etapas}
            semanalConfig={config.semanalConfig}
            esPadre={esPadre}
          />
        </TabsContent>

        {/* PESTAÑA 4: RUTINA MENSUAL Y METAS */}
        <TabsContent value="mensual" className="animate-in fade-in duration-300">
          <RutinaMensualView
            metas={config.metasMensuales}
            onToggleMeta={handleToggleMeta}
            onAgregarMeta={handleAgregarMeta}
            esPadre={esPadre}
          />
        </TabsContent>
      </Tabs>

      {/* Modal Editor para Padres */}
      <EditorEtapaModal
        abierto={modalEditorAbierto}
        onOpenChange={setModalEditorAbierto}
        etapaParaEditar={etapaAEditar}
        onGuardar={handleGuardarEtapa}
        onEliminar={handleEliminarEtapa}
      />
    </div>
  );
}
