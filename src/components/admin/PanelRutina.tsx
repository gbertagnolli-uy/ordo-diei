"use client";

// Rutina familiar (lane 259): los padres editan la rutina base que ven todos los dispositivos.
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { CATEGORIAS_INFO, CONFIGURACION_DEFAULT, type DiasAplicables, type EtapaRutina, type RutinaSemanalConfig } from "@/lib/rutina/tipos";
import { EditorEtapaModal } from "@/components/rutina/EditorEtapaModal";
import { IconoRutina } from "@/components/rutina/IconoRutina";

const NOMBRES_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function textoDias(d: DiasAplicables): string {
  if (d === "todos") return "Todos los días";
  if (d === "laborables") return "Lunes a viernes";
  if (d === "finDeSemana") return "Fin de semana";
  return d.map((n) => NOMBRES_DIA[n]).join(", ");
}

export function PanelRutina() {
  const [etapas, setEtapas] = useState<EtapaRutina[] | null>(null);
  const [semanal, setSemanal] = useState<RutinaSemanalConfig>(CONFIGURACION_DEFAULT.semanalConfig);
  const [guardando, setGuardando] = useState(false);
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [etapaEditada, setEtapaEditada] = useState<EtapaRutina | null>(null);

  useEffect(() => {
    fetch("/api/rutina", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setEtapas(d.etapas);
        if (d.semanalConfig) setSemanal(d.semanalConfig);
      })
      .catch(() => toast.error("No se pudo cargar la rutina"));
  }, []);

  const guardar = useCallback(async (nuevasEtapas: EtapaRutina[], nuevaSemanal: RutinaSemanalConfig) => {
    setGuardando(true);
    try {
      const res = await fetch("/api/rutina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapas: nuevasEtapas, semanalConfig: nuevaSemanal }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo guardar la rutina");
        return false;
      }
      setEtapas(d.etapas);
      setSemanal(d.semanalConfig);
      toast.success("Rutina guardada");
      return true;
    } finally {
      setGuardando(false);
    }
  }, []);

  if (!etapas) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const abrirEditor = (etapa: EtapaRutina | null) => {
    setEtapaEditada(etapa);
    setEditorAbierto(true);
  };
  const onGuardarEtapa = (etapa: EtapaRutina) => {
    const existe = etapas.some((e) => e.id === etapa.id);
    void guardar(existe ? etapas.map((e) => (e.id === etapa.id ? etapa : e)) : [...etapas, etapa], semanal);
  };
  const onEliminarEtapa = (id: string) => {
    if (etapas.length <= 1) {
      toast.error("La rutina necesita al menos una etapa");
      return;
    }
    void guardar(etapas.filter((e) => e.id !== id), semanal);
  };
  const restablecer = () => {
    if (confirm("¿Restablecer la rutina familiar a los horarios por defecto? Se pierden los cambios.")) {
      void guardar(CONFIGURACION_DEFAULT.etapas, CONFIGURACION_DEFAULT.semanalConfig);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2">
          <div className="mr-auto">
            <CardTitle>Etapas del día</CardTitle>
            <CardDescription>Lo que cambies acá lo ve toda la familia en Rutina y horarios.</CardDescription>
          </div>
          <Button size="sm" onClick={() => abrirEditor(null)} disabled={guardando}>
            <Plus /> Nueva etapa
          </Button>
          <Button size="sm" variant="ghost" onClick={restablecer} disabled={guardando}>
            <RotateCcw /> Restablecer
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {etapas.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <span className="w-24 shrink-0 text-sm tabular-nums">
                  {e.horaInicio}–{e.horaFin}
                </span>
                <IconoRutina nombre={e.icono} className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORIAS_INFO[e.categoria]?.label ?? e.categoria} · {textoDias(e.diasSemana)}
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={`Editar ${e.titulo}`} onClick={() => abrirEditor(e)} disabled={guardando}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${e.titulo}`} onClick={() => onEliminarEtapa(e.id)} disabled={guardando}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semana</CardTitle>
          <CardDescription>Textos de la pestaña semanal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rutina-enfoque">Enfoque de la semana</Label>
            <Textarea id="rutina-enfoque" value={semanal.enfoqueSemanal} onChange={(ev) => setSemanal({ ...semanal, enfoqueSemanal: ev.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rutina-sabado">Sábado</Label>
            <Textarea id="rutina-sabado" value={semanal.notasSabado} onChange={(ev) => setSemanal({ ...semanal, notasSabado: ev.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rutina-domingo">Domingo</Label>
            <Textarea id="rutina-domingo" value={semanal.notasDomingo} onChange={(ev) => setSemanal({ ...semanal, notasDomingo: ev.target.value })} />
          </div>
          <Button onClick={() => void guardar(etapas, semanal)} disabled={guardando}>
            {guardando && <Spinner />} Guardar semana
          </Button>
        </CardContent>
      </Card>

      <EditorEtapaModal
        abierto={editorAbierto}
        onOpenChange={setEditorAbierto}
        etapaParaEditar={etapaEditada}
        onGuardar={onGuardarEtapa}
        onEliminar={onEliminarEtapa}
      />
    </div>
  );
}