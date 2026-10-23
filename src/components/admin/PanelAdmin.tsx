"use client";

// Panel de administración: un solo lugar para llegar a todo lo que solo hacen padres y madres.
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  FilePen,
  Gift,
  HeartHandshake,
  PartyPopper,
  UsersRound,
  Image as ImageIcon,
  KeyRound,
  Layers,
  ListPlus,
  PackageCheck,
  ShoppingCart,
  Sunset,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { PanelHistoriaAcciones } from "./PanelHistoriaAcciones";

export type PendientesAdmin = { solicitudesHabitos: number; premiosPorEntregar: number; comprasPorAprobar?: number };

type Accion = {
  href: string;
  titulo: string;
  descripcion: string;
  icon: LucideIcon;
  pendientes?: number;
};

export function PanelAdmin({ pendientes }: { pendientes: PendientesAdmin }) {
  const [simulando, setSimulando] = useState(false);

  const grupos: { titulo: string; acciones: Accion[] }[] = [
    {
      titulo: "Tareas y hábitos",
      acciones: [
        { href: "/dashboard/tasks/new", titulo: "Nueva tarea", descripcion: "Asigná una tarea a uno o más miembros.", icon: ListPlus },
        {
          href: "/dashboard/admin/tareas",
          titulo: "Tareas",
          descripcion: "Creá, editá, mirá y eliminá las tareas de toda la familia.",
          icon: CalendarDays,
        },
        {
          href: "/dashboard/admin/aprobaciones",
          titulo: "Aprobaciones",
          descripcion: "Tareas y hábitos que esperan tu aprobación.",
          icon: CheckCircle2,
          pendientes: pendientes.solicitudesHabitos,
        },
      ],
    },
    {
      titulo: "Hijos y conducta",
      acciones: [
        {
          href: "/dashboard/admin/hijos",
          titulo: "Resumen de los hijos",
          descripcion: "Una pestaña por hijo: conducta, rendimiento, pendientes y tareas de un vistazo.",
          icon: UsersRound,
        },
        {
          href: "/dashboard/admin/conducta",
          titulo: "Registrar conducta",
          descripcion: "Marcá cómo se portó cada hijo hoy, de «Muy mal» a «Excelente».",
          icon: HeartHandshake,
        },
        {
          href: "/dashboard/admin/comportamiento",
          titulo: "Regalar premio",
          descripcion: "Premios sorpresa y penitencias por algo que hizo un hijo y no está en la app.",
          icon: PartyPopper,
        },
        { href: "/dashboard/premios", titulo: "Premios familiares", descripcion: "Premios sorpresa semanales y mensuales por tareas.", icon: Gift },
        {
          href: "/dashboard/mis-premios",
          titulo: "Premios para entregar",
          descripcion: "Premios que tus hijos reclamaron y esperan que se los entregues.",
          icon: PackageCheck,
          pendientes: pendientes.premiosPorEntregar,
        },
        {
          href: "/dashboard/admin/tienda",
          titulo: "Tienda",
          descripcion: "Productos que se canjean con monedas: precios, stock, requisitos y compras por aprobar.",
          icon: ShoppingCart,
          pendientes: pendientes.comprasPorAprobar,
        },
        { href: "/dashboard/cartas/admin", titulo: "Administrar cartas", descripcion: "Creá, editá y archivá las cartas de la colección.", icon: Layers },
      ],
    },
    {
      titulo: "Familia",
      acciones: [
        { href: "/dashboard/users/new", titulo: "Nuevo miembro", descripcion: "Sumá a alguien de la familia con su PIN.", icon: UserPlus },
        { href: "/dashboard/users/pines", titulo: "Restablecer PIN", descripcion: "Cambiá el PIN de un miembro que lo olvidó.", icon: KeyRound },
        { href: "/dashboard/rules", titulo: "Reglas del hogar", descripcion: "Editá las reglas que ve toda la familia.", icon: FilePen },
        { href: "/dashboard/admin/reposo", titulo: "Reposo", descripcion: "Tiempos de la pantalla de reposo, fotos de fondo y referencias.", icon: ImageIcon },
      ],
    },
  ];

  const simularDia = async () => {
    if (!confirm("¿Deseas simular que ha pasado 1 día completo? Esto vencerá tareas atrasadas y regenerará las recurrentes.")) return;
    setSimulando(true);
    try {
      const res = await fetch("/api/cron", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("¡El Tiempo Avanzó! Se regeneraron las tareas recurrentes.");
    } catch {
      toast.error("No se pudo simular el día");
    } finally {
      setSimulando(false);
    }
  };

  return (
    <div className="space-y-8">
      {grupos.map((g) => (
        <section key={g.titulo} className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{g.titulo}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.acciones.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <a.icon className="size-5" />
                      </div>
                      {!!a.pendientes && <Badge className="tabular-nums">{a.pendientes} pendientes</Badge>}
                    </div>
                    <CardTitle className="font-heading text-base">{a.titulo}</CardTitle>
                    <CardDescription>{a.descripcion}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Mantenimiento</h2>
        <Button variant="outline" onClick={simularDia} disabled={simulando}>
          {simulando ? <Spinner /> : <Sunset className="size-4 text-destructive" />} Simular día (cron)
        </Button>
      </section>

      <section className="space-y-3 pt-6 border-t border-white/10">
        <PanelHistoriaAcciones />
      </section>
    </div>
  );
}
