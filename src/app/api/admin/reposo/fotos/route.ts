import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { listarPool, ocultarFoto } from "@/lib/reposo/repositorio";
import { aFotoPublica } from "@/lib/reposo/unsplash";

export const dynamic = "force-dynamic";

// GET /api/admin/reposo/fotos — todo el pool (también ocultas y desactivadas) para el panel
export const GET = () =>
  conSesion(async () => {
    const fotos = await listarPool();
    return fotos.map((f) => ({ ...aFotoPublica(f), activa: f.activa, oculta: f.oculta, orientacion: f.orientacion }));
  }, { soloPadres: true });

const patchSchema = z.object({ id: z.string().min(1), oculta: z.boolean() });

// PATCH /api/admin/reposo/fotos — oculta o vuelve a mostrar una foto
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion(async () => {
    const { id, oculta } = patchSchema.parse(body);
    await ocultarFoto(id, oculta);
    return { id, oculta };
  }, { soloPadres: true });
}
