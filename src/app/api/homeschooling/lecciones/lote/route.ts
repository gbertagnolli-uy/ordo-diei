import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { crearLeccionesEnLote } from "@/lib/homeschooling/servidor/cursos";
import { vistaPreviaLote } from "@/lib/homeschooling/servidor/lote";
import { idPositivo, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";

const cuerpoPrevia = z.object({ texto: z.string().max(40000) });
const cuerpoCrear = z.object({
  recursoId: idPositivo,
  lecciones: z.array(z.object({ titulo: z.string().trim().min(1, "Falta un título").max(150), url: z.string().trim().max(500).nullable().optional() })).min(1, "No hay lecciones para crear").max(100),
});

// POST { texto }: detecta cada línea de la lista pegada y completa los títulos. No guarda nada
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion(async () => vistaPreviaLote(cuerpoPrevia.parse(body).texto), { soloPadres: true });
}

// PUT { recursoId, lecciones }: crea las lecciones de una vez
export async function PUT(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    const d = cuerpoCrear.parse(body);
    return crearLeccionesEnLote(s, d.recursoId, d.lecciones, hoyEnFamilia());
  }, { soloPadres: true });
}
