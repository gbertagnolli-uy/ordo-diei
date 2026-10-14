import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearEvidencia, listarEvidencias } from "@/lib/homeschooling/servidor/evidencia";
import { alumnoDe, datosEvidencia, estadoEvidencia, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// POST: el alumno sube la evidencia de un trabajo (fotos ya guardadas con /api/upload)
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => crearEvidencia(s, datosEvidencia.parse(body)));
}

// GET ?estado=&alumnoId=&materiaId=&mes=YYYY-MM&destacada=1: un Hijo solo recibe las suyas
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  const materiaId = Number(q.get("materiaId"));
  const estado = q.get("estado") ? estadoEvidencia.parse(q.get("estado")) : undefined;
  return conSesion((s) =>
    listarEvidencias(s, {
      estado,
      alumnoId: alumnoDe(req),
      materiaId: Number.isInteger(materiaId) && materiaId > 0 ? materiaId : null,
      mes: q.get("mes"),
      destacada: q.get("destacada") === "1",
    })
  );
}
