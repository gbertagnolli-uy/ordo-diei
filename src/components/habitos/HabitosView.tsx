"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EstadoUsuario, HabitoVista } from "@/lib/habitos/server";
import { HabitosClient } from "./HabitosClient";
import { FamiliaHabitos, type Miembro } from "./FamiliaHabitos";
import { HabitoDialog } from "./HabitoDialog";

export function HabitosView({
  inicial,
  catalogo,
  estados = [],
  miembros = [],
  esPadre = false,
  usuarioActualId,
}: {
  inicial: EstadoUsuario;
  catalogo: HabitoVista[];
  estados?: EstadoUsuario[];
  miembros?: Miembro[];
  esPadre?: boolean;
  usuarioActualId: number;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preseleccionMiembro, setPreseleccionMiembro] = useState<number | null>(null);

  const practicaRosario = inicial.habitos.some((h) => h.clave === "rosario");
  const subtitle = practicaRosario && inicial.misterios?.serie
    ? `Hoy, misterios ${inicial.misterios.serie.toLowerCase()}`
    : undefined;

  return (
    <div className="flex flex-col">
      <PageHeader group="Rutina" title="Mis hábitos" subtitle={subtitle}>
        <Button
          size="sm"
          onClick={() => {
            setPreseleccionMiembro(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Agregar hábito
        </Button>
      </PageHeader>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        {esPadre && miembros.length > 0 ? (
          <Tabs defaultValue="propio" className="gap-6">
            <TabsList>
              <TabsTrigger value="propio">Mis hábitos</TabsTrigger>
              <TabsTrigger value="familia">Familia</TabsTrigger>
            </TabsList>

            <TabsContent value="propio">
              <HabitosClient
                inicial={inicial}
                catalogo={catalogo}
                miembros={miembros}
                esPadre={esPadre}
                usuarioActualId={usuarioActualId}
              />
            </TabsContent>

            <TabsContent value="familia">
              <FamiliaHabitos
                miembros={miembros}
                estados={estados}
                catalogo={catalogo}
                hoy={inicial.hoy}
                onAbrirAgregarPara={(miembroId) => {
                  setPreseleccionMiembro(miembroId);
                  setDialogOpen(true);
                }}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <HabitosClient
            inicial={inicial}
            catalogo={catalogo}
            miembros={miembros}
            esPadre={esPadre}
            usuarioActualId={usuarioActualId}
          />
        )}
      </main>

      <HabitoDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        catalogo={catalogo}
        habitosActivos={inicial.habitos}
        miembros={miembros}
        esPadre={esPadre}
        usuarioActualId={usuarioActualId}
        preseleccionMiembroId={preseleccionMiembro}
      />
    </div>
  );
}
