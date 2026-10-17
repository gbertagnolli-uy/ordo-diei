"use client";

// Propio de Ordo: puente entre la página servidor y los componentes portados — AuthProvider (sesión) y re-lectura
// de la página (router.refresh) después de un cambio.

import { useRouter } from "next/navigation";
import { AuthProvider, type UsuarioSesion } from "@/components/homeschooling/roost/auth";
import type { Group } from "@/lib/homeschooling/roost/tipos";
import type { PlanVista } from "./CursoDetalle";
import type { AlumnoLite } from "./MateriaHeader";
import MateriaLayout from "./MateriaLayout";

export default function MateriaPagina({
  usuario,
  group,
  alumnos,
  alumnoInicial,
  planesPorCurso,
}: {
  usuario: UsuarioSesion;
  group: Group;
  alumnos: AlumnoLite[];
  alumnoInicial: number | null;
  planesPorCurso: Record<number, PlanVista[]>;
}) {
  const router = useRouter();
  return (
    <AuthProvider usuario={usuario}>
      <MateriaLayout group={group} alumnos={alumnos} alumnoInicial={alumnoInicial} planesPorCurso={planesPorCurso} onCambio={() => router.refresh()} />
    </AuthProvider>
  );
}
