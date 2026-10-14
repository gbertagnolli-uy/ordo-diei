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
  const [segundosOffsetManual, setSegundosOffsetManual] = useState(0);
  const [esFullscreen, setEsFullscreen] = useState(false);

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

  // Cálculo del progreso y cuenta regresiva
  const progreso = useMemo(() => {
    if (!etapaActual) {
      return {
        totalSeg: segHastaProxima > 0 ? segHastaProxima : 3600,
        transcurridoSeg: 0,
        restanteSeg: segHastaProxima > 0 ? segHastaProxima : 0,
        porcentaje: 0,
        porcentajeRestante: 100,
        fase: "verde" as const,
      };
    }
    const res = calcularProgresoEtapa(etapaActual, horaActual);
    // Aplicar offset manual (+5 min etc) si existe
    if (segundosOffsetManual !== 0) {
      const rest = Math.max(0, res.restanteSeg + segundosOffsetManual);
      const total = res.totalSeg + Math.max(0, segundosOffsetManual);
      const pctRestante = Math.min(100, Math.round((rest / total) * 100));
      return {
        ...res,
        totalSeg: total,
        restanteSeg: rest,
        porcentajeRestante: pctRestante,
      };
    }
    return res;
  }, [etapaActual, horaActual, segHastaProxima, segundosOffsetManual]);

  // Detector de alarmas por transición de etapa
  useEffect(() => {
    if (!etapaActual) return;

    // Si cambió la etapa activa y tiene alarma configurada
    if (etapaActual.id !== ultimaEtapaIdAlarmaRef.current) {
      ultimaEtapaIdAlarmaRef.current = etapaActual.id;
      setSegundosOffsetManual(0); // Reiniciar extensiones manuales

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

  // Manejadores de acciones
  const handleTogglePausa = () => setEstaPausado((prev) => !prev);

  const handleExtenderTiempo = () => {
    setSegundosOffsetManual((prev) => prev + 300); // +5 min
  };

  const handleAvanzarEtapa = () => {
    if (proximaEtapa) {
      // Notificar avance
      setAlarmaActivaEtapa(null);
      setSegundosOffsetManual(0);
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
        onExtender={handleExtenderTiempo}
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
                porcentajeRestante={progreso.porcentajeRestante}
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
