"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Plus, Sprout, Sun, Sunset, Moon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { useModalStore } from "@/store/modalStore";
import type { Franja, Marca } from "@/lib/habitos/catalogo";
import type { EstadoHabito, EstadoUsuario, HabitoVista } from "@/lib/habitos/server";
import { HabitoCard } from "./HabitoCard";
import { Escalera } from "./Escalera";
import { CalendarioHabitos } from "./CalendarioHabitos";
import { TrayectoriaHabitos } from "./TrayectoriaHabitos";
import { HabitoDialog, type MiembroSelector } from "./HabitoDialog";

const SECCIONES_FRANJA: { franja: Franja; titulo: string; icono: React.ElementType }[] = [
  { franja: "manana", titulo: "Mañana", icono: Sun },
  { franja: "tarde", titulo: "Tarde", icono: Sunset },
  { franja: "noche", titulo: "Noche", icono: Moon },
];

export function HabitosClient({
  inicial,
  catalogo,
  miembros = [],
  esPadre = false,
  usuarioActualId,
}: {
  inicial: EstadoUsuario;
  catalogo: HabitoVista[];
  miembros?: MiembroSelector[];
  esPadre?: boolean;
  usuarioActualId: number;
}) {
  const router = useRouter();
  const openModal = useModalStore((s) => s.openModal);

  const [estado, setEstado] = useState<EstadoUsuario>(inicial);
  const [previo, setPrevio] = useState<EstadoUsuario>(inicial);
  if (inicial !== previo) {
    setPrevio(inicial);
    setEstado(inicial);
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [habitoAEditar, setHabitoAEditar] = useState<EstadoHabito | null>(null);
  const [preseleccionMiembro, setPreseleccionMiembro] = useState<number | null>(null);
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);

  const habitos = estado.habitos;
  const programadosHoy = habitos.filter((h) => h.programadoHoy);
  const hechosHoy = programadosHoy.filter((h) => h.hoy === "hecho");
  const porcentajeHoy =
    programadosHoy.length > 0 ? Math.round((hechosHoy.length / programadosHoy.length) * 100) : 0;

  // Hábitos en etapa Retomando (G3)
  const enRetomando = habitos.filter((h) => h.etapa === "retomando");

  // Registrar hábito
  const handleRegistrar = async (habitoId: number, marca: Marca | null, nota?: string, paginas?: number) => {
    setOcupadoId(habitoId);
    try {
      const res = await fetch("/api/habitos/registro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitoId,
          marca,
          nota,
          paginas,
          usuarioIds: [estado.usuarioId],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al registrar");

      const nuevoEstado: EstadoUsuario = json.estados[0];
      setEstado(nuevoEstado);
      router.refresh();

      // Verificar si hubo eventos de ascenso, completo o regreso para celebrar
      const habActualizado = nuevoEstado.habitos.find((x) => x.habitoId === habitoId);
      const eventoCelebrable = habActualizado?.eventos.find((e) => e !== "recaida");
      if (habActualizado && eventoCelebrable) {
        openModal("HABITO", {
          tipo: eventoCelebrable,
          habito: habActualizado.nombre,
          paso: eventoCelebrable === "ascenso" ? habActualizado.pasoActual.titulo : null,
          categoria: habActualizado.categoria,
        });
      }

      // Libro terminado: premio "Un libro nuevo" (vault/HABITO_LIBRO.md)
      const rec = json.recompensas?.[0];
      if (rec?.libroTerminado) {
        openModal("HABITO", { tipo: "libro", habito: rec.libroTerminado, paso: null, categoria: "cuidado" });
      }
      return rec ? { puntos: rec.puntos, xp: rec.xp } : undefined;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setOcupadoId(null);
    }
  };

  // Cargar el libro que se empieza a leer (o corregir el actual)
  const handleCargarLibro = async (habitoId: number, datos: { titulo: string; paginas: number }) => {
    setOcupadoId(habitoId);
    try {
      const res = await fetch("/api/habitos/libros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitoId, ...datos, usuarioIds: [estado.usuarioId] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar el libro");
      setEstado(json.estados[0]);
      router.refresh();
      const terminado = json.terminados?.[0];
      if (terminado) {
        openModal("HABITO", { tipo: "libro", habito: terminado.titulo, paso: null, categoria: "cuidado" });
      }
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al guardar el libro");
      return false;
    } finally {
      setOcupadoId(null);
    }
  };

  // Ajustar días o ancla de adopción
  const handleAjustar = (h: EstadoHabito) => {
    setHabitoAEditar(h);
    setDialogOpen(true);
  };

  // Dejar de practicar
  const handleDejarDePracticar = async (habitoId: number) => {
    try {
      const res = await fetch("/api/habitos/adopciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitoId,
          activo: false,
          usuarioIds: [estado.usuarioId],
        }),
      });
      if (!res.ok) throw new Error("Error al desactivar hábito");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  // Archivar hábito
  const handleArchivar = async (habitoId: number) => {
    try {
      const res = await fetch(`/api/habitos/${habitoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al archivar hábito");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al archivar");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Resumen de hoy: Anillo Streaks y bienvenida */}
      {habitos.length > 0 && (
        <Card className="overflow-hidden bg-card/60 backdrop-blur-xs">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-heading text-xl font-bold">Progreso de hoy</h3>
              <p className="text-sm text-muted-foreground">
                {programadosHoy.length === 0
                  ? "Hoy es día libre para todos tus hábitos programados."
                  : hechosHoy.length === programadosHoy.length
                  ? "¡Completaste todos tus hábitos programados para hoy!"
                  : `Completaste ${hechosHoy.length} de ${programadosHoy.length} hábitos programados.`}
              </p>
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setHabitoAEditar(null);
                    setPreseleccionMiembro(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="size-4" /> Agregar hábito
                </Button>
              </div>
            </div>

            {programadosHoy.length > 0 && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="relative size-24 flex items-center justify-center">
                  <AnimatedCircularProgressBar
                    max={100}
                    min={0}
                    value={porcentajeHoy}
                    gaugePrimaryColor="var(--primary)"
                    gaugeSecondaryColor="var(--muted)"
                    className="size-24 text-sm font-bold"
                  />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {hechosHoy.length} / {programadosHoy.length} listos
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. Alertas de recaída compasiva (G3) */}
      {enRetomando.map((h) => (
        <Alert key={h.habitoId} className="border-primary/30 bg-primary/5">
          <HeartHandshake className="size-5 text-primary" />
          <AlertTitle className="font-heading font-semibold">
            Retomando: {h.nombre}
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            No pasa nada por haber tenido días difíciles. Lo que forma la virtud es volver a empezar.
            <strong className="block mt-1 text-foreground">
              Tu receta: Después de {h.ancla}, {h.pasoActual.titulo}.
            </strong>
          </AlertDescription>
        </Alert>
      ))}

      {/* 3. Secciones por franja o estado vacío */}
      {habitos.length === 0 ? (
        <Empty className="py-12 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sprout className="size-5 text-primary" />
            </EmptyMedia>
            <EmptyTitle>Elegí con qué empezar</EmptyTitle>
            <EmptyDescription>
              Comenzar con uno o dos hábitos bien elegidos es la mejor manera de afianzar la rutina.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => {
                setHabitoAEditar(null);
                setPreseleccionMiembro(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Elegir hábitos
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-8">
          {SECCIONES_FRANJA.map(({ franja, titulo, icono: IconoFranja }) => {
            const habitosFranja = habitos.filter((h) => h.franja === franja);
            if (habitosFranja.length === 0) return null;

            return (
              <section key={franja} className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <IconoFranja className="size-5 text-primary" />
                  <h3 className="font-heading text-lg font-bold">{titulo}</h3>
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    ({habitosFranja.length})
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {habitosFranja.map((h) => (
                    <HabitoCard
                      key={h.habitoId}
                      h={h}
                      misterios={estado.misterios?.misterios || []}
                      ocupado={ocupadoId === h.habitoId}
                      puedeEditar={h.creadorId === usuarioActualId}
                      onRegistrar={handleRegistrar}
                      onAjustar={handleAjustar}
                      onDejarDePracticar={handleDejarDePracticar}
                      onEditar={(item) => {
                        setHabitoAEditar(item);
                        setDialogOpen(true);
                      }}
                      onArchivar={handleArchivar}
                      onCargarLibro={handleCargarLibro}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 4. Escalera de progreso (para hábitos con más de 1 paso) */}
      <Escalera habitos={habitos} misterios={estado.misterios?.misterios || []} />

      {/* 5. Trayectoria y mapa de calor */}
      {habitos.length > 0 && (
        <div className="space-y-6">
          <TrayectoriaHabitos habitos={habitos} />
          <CalendarioHabitos habitos={habitos} hoy={estado.hoy} />
        </div>
      )}

      {/* Diálogo de 2 pasos para crear, adoptar o editar hábitos */}
      <HabitoDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setHabitoAEditar(null);
        }}
        catalogo={catalogo}
        habitosActivos={habitos}
        miembros={miembros}
        esPadre={esPadre}
        usuarioActualId={usuarioActualId}
        preseleccionMiembroId={preseleccionMiembro}
        habitoAEditar={habitoAEditar}
      />
    </div>
  );
}
