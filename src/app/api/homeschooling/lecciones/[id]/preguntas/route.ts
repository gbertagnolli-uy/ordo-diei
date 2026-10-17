import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { guardarPreguntas, preguntasCompletas, preguntasParaAlumno } from "@/lib/homeschooling/servidor/quiz";
import { idDe, leerJson, preguntasEditables } from "../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// GET ?tipo=checkpoint|final: solo id, orden, segundoVideo, enunciado y opciones (nunca `correcta` ni `explicacion`).
// Un padre puede pedir ?completas=1 para el editor.
export async function GET(req: NextRequest, { params }: Ctx) {
  const q = new URL(req.url).searchParams;
  const tipo = z.enum(["checkpoint", "final"]).catch("final").parse(q.get("tipo"));
  return conSesion(async (s) => {
    const id = await idDe(params);
    return q.get("completas") === "1" ? preguntasCompletas(s, id) : preguntasParaAlumno(s, id, tipo);
  });
}

// PUT { preguntas }: reemplaza las preguntas de la lección (solo padres)
export async function PUT(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => guardarPreguntas(s, await idDe(params), preguntasEditables.parse(body).preguntas), { soloPadres: true });
}
