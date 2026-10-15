import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearMaterial, listarMateriales } from "@/lib/homeschooling/servidor/materiales";
import { datosMaterial, destinoDe, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// GET ?diaId= | ?leccionId= | ?alumnoId=&fecha=: el material de un día, una lección o un alumno en una fecha
export async function GET(req: NextRequest) {
  return conSesion((s) => listarMateriales(s, destinoDe(req)));
}

// POST { destino, entrada, titulo?, tipo?, limiteImpresiones? }: agrega material (el servidor detecta el tipo). Solo padres
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => crearMaterial(s, datosMaterial.parse(body)), { soloPadres: true });
}
