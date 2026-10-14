"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Clock,
  Calendar,
  CalendarDays,
  Sparkles,
  RotateCcw,
  Plus,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
  Bell,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  EtapaRutina,
  ConfiguracionRutina,
  CONFIGURACION_DEFAULT,
} from "@/lib/rutina/tipos";
import {
  obtenerEtapaActual,
  obtenerProximaEtapa,
  calcularProgresoEtapa,
  posponerDesdeEtapa,
  extenderEtapaActiva,
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

export function RutinaClientPage({ currentUser }: RutinaClientPageProps) {
  const esPadre =
    currentUser?.rolFamiliar === "Padre" || currentUser?.rolFamiliar === "Madre";

  const [config, setConfig] = useState<ConfiguracionRutina>(CONFIGURACION_DEFAULT);
  const [horaActual, setHoraActual] = useState<Date>(new Date());
  const [estaPausado, setEstaPausado] = useState(false);
  const [esFullscreen, setEsFullscreen] = useState(false);

  // Referencias para congelar el tiempo exacto en pausa y calcular el desfase
  const pausaInicioRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef<number | null>(null);
  const pausedRatioRef = useRef<number | null>(null);

  // Etapa con alarma activa para el banner superior
  const [alarmaActivaEtapa, setAlarmaActivaEtapa] = useState<EtapaRutina | null>(null);
  const ultimaEtapaIdAlarmaRef = useRef<string | null>(null);

  // Seguimiento de etapas completadas hoy (en memoria de sesión)
  const [completadasIds, setCompletadasIds] = useState<Set<string>>(new Set());

  // Estado del modal editor
  const [modalEditorAbierto, setModalEditorAbierto] = useState(false);
  const [etapaAEditar, setEtapaAEditar] = useState<EtapaRutina | null>(null);

  // Tab activo
  const [tabActivo, setTabActivo] = useState("vivo");

  // Cargar configuración desde localStorage al montar
  useEffect(() => {
    const cargada = obtenerConfiguracionRutina();
    setConfig(cargada);

    const onActualizada = (e: Event) => {
      const customEvent = e as CustomEvent<ConfiguracionRutina>;
      if (customEvent.detail) setConfig(customEvent.detail);
    };

    window.addEventListener("rutina-actualizada", onActualizada);
    return () => window.removeEventListener("rutina-actualizada", onActualizada);
  }, []);

  // Reloj en vivo (actualiza cada 1 segundo)
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cálculo de la etapa actual y próxima
  const { etapa: etapaActual, index: etapaActualIndex } = useMemo(() => {
    return obtenerEtapaActual(config.etapas, horaActual);
  }, [config.etapas, horaActual]);

  const { etapa: proximaEtapa, restanteSeg: segHastaProxima } = useMemo(() => {
    return obtenerProximaEtapa(config.etapas, horaActual);
  }, [config.etapas, horaActual]);

  // Cálculo del progreso y cuenta regresiva continua
  const progresoCalculado = useMemo(() => {
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
    return calcularProgresoEtapa(etapaActual, horaActual);
  }, [etapaActual, horaActual, segHastaProxima]);

  // Progreso con soporte de pausa real: si está pausado, congelamos el valor
  const progreso = useMemo(() => {
    if (estaPausado && pausedRemainingRef.current !== null && pausedRatioRef.current !== null) {
      return {
        ...progresoCalculado,
        restanteSeg: pausedRemainingRef.current,
        ratioRestante: pausedRatioRef.current,
        porcentajeRestante: pausedRatioRef.current * 100,
      };
    }
    return progresoCalculado;
  }, [estaPausado, progresoCalculado]);

  // Detector de alarmas por transición de etapa
  useEffect(() => {
    if (!etapaActual) return;

    // Si cambió la etapa activa y tiene alarma configurada
    if (etapaActual.id !== ultimaEtapaIdAlarmaRef.current) {
      ultimaEtapaIdAlarmaRef.current = etapaActual.id;

      if (etapaActual.alarmaSonora && config.sonidoHabilitado) {
        reproducirAlarma(config.tipoSonido, config.volumen);
        setAlarmaActivaEtapa(etapaActual);

        // Notificación de escritorio si está permitida
        emitirNotificacion(`🔔 ${etapaActual.titulo}`, {
          body: `Hora: ${etapaActual.horaInicio} - ${etapaActual.horaFin}. ¡Etapa familiar iniciada!`,
        });
      }
    }
  }, [etapaActual, config.sonidoHabilitado, config.tipoSonido, config.volumen]);

  // Manejador del botón de Pausa: congela el temporizador y al reanudar desplaza la rutina
  const handleTogglePausa = () => {
    if (!estaPausado) {
      // Activar pausa: congelar valores en este instante exacto
      pausaInicioRef.current = Date.now();
      pausedRemainingRef.current = progresoCalculado.restanteSeg;
      pausedRatioRef.current = progresoCalculado.ratioRestante;
      setEstaPausado(true);
    } else {
      // Reanudar: si se pausó por 30s o más, trasladar el horario en cascada
      if (pausaInicioRef.current && etapaActual) {
        const segPausados = Math.max(0, Math.round((Date.now() - pausaInicioRef.current) / 1000));
        if (segPausados >= 30) {
          const minutosShift = Math.max(1, Math.round(segPausados / 60));
          const nuevas = extenderEtapaActiva(config.etapas, etapaActual.id, minutosShift);
          const nuevaConfig = { ...config, etapas: nuevas };
          setConfig(nuevaConfig);
          guardarConfiguracionRutina(nuevaConfig);
        }
      }
      pausaInicioRef.current = null;
      pausedRemainingRef.current = null;
      pausedRatioRef.current = null;
      setEstaPausado(false);
    }
  };

  // Manejador de Extender Tiempo (+5 min): alarga la etapa actual y corre las siguientes en cascada
  const handleExtenderTiempo = () => {
    if (!etapaActual) return;
    const nuevas = extenderEtapaActiva(config.etapas, etapaActual.id, 5);
    const nuevaConfig = { ...config, etapas: nuevas };
    setConfig(nuevaConfig);
    guardarConfiguracionRutina(nuevaConfig);
  };

  // Manejador de Posponer desde la Notificación Flotante:
  // Extiende la etapa previa para no dejar bache y traslada la nueva etapa y siguientes en cascada
  const handlePosponerDesdeAlarma = (minutos: number) => {
    if (!alarmaActivaEtapa) return;
    const nuevas = posponerDesdeEtapa(config.etapas, alarmaActivaEtapa.id, minutos, true);
    const nuevaConfig = { ...config, etapas: nuevas };
    setConfig(nuevaConfig);
    guardarConfiguracionRutina(nuevaConfig);
    setAlarmaActivaEtapa(null);
  };

  const handleAvanzarEtapa = () => {
    if (proximaEtapa) {
      setAlarmaActivaEtapa(null);
    }
  };

  const handleToggleCompletada = (id: string) => {
    setCompletadasIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGuardarEtapa = (etapa: EtapaRutina) => {
    setConfig((prev) => {
      const existe = prev.etapas.some((e) => e.id === etapa.id);
      let nuevasEtapas: EtapaRutina[];
      if (existe) {
        nuevasEtapas = prev.etapas.map((e) => (e.id === etapa.id ? etapa : e));
      } else {
        nuevasEtapas = [...prev.etapas, etapa];
      }
      // Reordenar por horaInicio ascendente
      nuevasEtapas.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
      const nuevaConfig = { ...prev, etapas: nuevasEtapas };
      guardarConfiguracionRutina(nuevaConfig);
      return nuevaConfig;
    });
  };

  const handleEliminarEtapa = (id: string) => {
    setConfig((prev) => {
      const filtradas = prev.etapas.filter((e) => e.id !== id);
      const nuevaConfig = { ...prev, etapas: filtradas };
      guardarConfiguracionRutina(nuevaConfig);
      return nuevaConfig;
    });
  };

  const handleRestablecerDefault = () => {
    if (
      confirm(
        "¿Deseas restablecer toda la rutina familiar a los horarios oficiales por defecto?"
      )
    ) {
      const rest = restablecerRutinaDefault();
      setConfig(rest);
    }
  };

  const handleToggleSonido = () => {
    setConfig((prev) => {
      const nueva = { ...prev, sonidoHabilitado: !prev.sonidoHabilitado };
      guardarConfiguracionRutina(nueva);
      return nueva;
    });
  };

  const handleChangeTipoSonido = (tipo: TipoSonidoRutina) => {
    setConfig((prev) => {
      const nueva = { ...prev, tipoSonido: tipo };
      guardarConfiguracionRutina(nueva);
      return nueva;
    });
    reproducirAlarma(tipo, config.volumen);
  };

  const handleChangeVolumen = (vol: number) => {
    setConfig((prev) => {
      const nueva = { ...prev, volumen: vol };
      guardarConfiguracionRutina(nueva);
      return nueva;
    });
  };

  const handleProbarSonido = () => {
    reproducirAlarma(config.tipoSonido, config.volumen);
  };

  const handleToggleMeta = (id: string) => {
    setConfig((prev) => {
      const nuevasMetas = prev.metasMensuales.map((m) =>
        m.id === id ? { ...m, completada: !m.completada } : m
      );
      const nuevaConfig = { ...prev, metasMensuales: nuevasMetas };
      guardarConfiguracionRutina(nuevaConfig);
      return nuevaConfig;
    });
  };

  const handleAgregarMeta = (titulo: string, virtud: string, descripcion: string) => {
    setConfig((prev) => {
      const nuevaMeta = {
        id: `meta-${Date.now()}`,
        mes: new Date().toISOString().slice(0, 7),
        titulo,
        virtudDelMes: virtud || undefined,
        descripcion: descripcion || undefined,
        completada: false,
      };
      const nuevaConfig = {
        ...prev,
        metasMensuales: [...prev.metasMensuales, nuevaMeta],
      };
      guardarConfiguracionRutina(nuevaConfig);
      return nuevaConfig;
    });
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Alerta / Banner de inicio de etapa */}
      <BarraAlarmaActiva
        etapa={alarmaActivaEtapa}
        onCerrar={() => setAlarmaActivaEtapa(null)}
        onPosponer={handlePosponerDesdeAlarma}
      />

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
                onClick={() => {
                  setEtapaAEditar(null);
                  setModalEditorAbierto(true);
                }}
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
            onClick={() => setEsFullscreen(!esFullscreen)}
            className="h-9 rounded-xl gap-1.5 text-xs font-medium"
            title="Modo pantalla completa para tablet o pared"
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
              <TemporizadorDisco
                etapaActual={etapaActual}
                proximaEtapa={proximaEtapa}
                restanteSeg={progreso.restanteSeg}
                totalSeg={progreso.totalSeg}
                ratioRestante={progreso.ratioRestante}
                fase={progreso.fase}
                estaPausado={estaPausado}
                onTogglePausa={handleTogglePausa}
                onExtenderTiempo={handleExtenderTiempo}
                onAvanzarEtapa={handleAvanzarEtapa}
                esFullscreen={esFullscreen}
                onToggleFullscreen={() => setEsFullscreen(!esFullscreen)}
                sonidoHabilitado={config.sonidoHabilitado}
                onToggleSonido={handleToggleSonido}
                tipoSonido={config.tipoSonido}
                onChangeTipoSonido={handleChangeTipoSonido}
                volumen={config.volumen}
                onChangeVolumen={handleChangeVolumen}
                onProbarSonido={handleProbarSonido}
              />
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
                  {config.etapas
                    .filter((_, idx) => idx >= etapaActualIndex)
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
            etapas={config.etapas}
            etapaActualId={etapaActual?.id || null}
            proximaEtapaId={proximaEtapa?.id || null}
            horaActual={horaActual}
            completadasIds={completadasIds}
            onToggleCompletada={handleToggleCompletada}
            onEditarEtapa={(etapa) => {
              setEtapaAEditar(etapa);
              setModalEditorAbierto(true);
            }}
            onCrearEtapa={() => {
              setEtapaAEditar(null);
              setModalEditorAbierto(true);
            }}
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
