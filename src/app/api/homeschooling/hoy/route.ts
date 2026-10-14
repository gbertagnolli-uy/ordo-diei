import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { esPadre } from "@/lib/habitos/permisos";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { asegurarTareasDeHoy } from "@/lib/homeschooling/servidor/tareas";
import { leccionesDeHoy } from "@/lib/homeschooling/servidor/hoy";
import { alumnoDe } from "../_comun";

export const dynamic = "force-dynamic";

// GET: lo que le toca estudiar hoy al alumno (crea las Tareas del día si faltan). Un padre puede pedir ?alumnoId=
export async function GET(req: NextRequest) {
  return conSesion(async (s) => {
    const alumnoId = esPadre(s.rol) ? (alumnoDe(req) ?? s.id) : s.id;
    const hoy = hoyEnFamilia();
    await asegurarTareasDeHoy(alumnoId, hoy);
    return leccionesDeHoy(alumnoId, hoy);
  });
}
