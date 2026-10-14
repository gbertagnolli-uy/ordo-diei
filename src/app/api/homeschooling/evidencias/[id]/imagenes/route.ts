import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { agregarImagen, quitarImagen } from "@/lib/homeschooling/servidor/evidencia";
import { idDe, idPositivo, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// POST { url, pie? }: agrega una foto (ya guardada con /api/upload)
export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  const datos = z.object({ url: z.string().trim().max(200), pie: z.string().trim().max(200).nullable().optional() }).parse(body);
  return conSesion(async (s) => agregarImagen(s, await idDe(params), datos.url, datos.pie));
}

// DELETE ?imagenId=: quita una foto (y borra el archivo si nadie más lo usa)
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const imagenId = idPositivo.parse(Number(new URL(req.url).searchParams.get("imagenId")));
  return conSesion(async (s) => quitarImagen(s, await idDe(params), imagenId));
}
