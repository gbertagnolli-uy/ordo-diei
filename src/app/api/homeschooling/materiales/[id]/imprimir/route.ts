import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { registrarImpresion } from "@/lib/homeschooling/servidor/impresiones";
import { idDe } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST: el alumno abre la vista de impresión de un material. Gasta una de sus impresiones; con el tope alcanzado responde 409
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => registrarImpresion(s, await idDe(params)));
}
