import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { cambiosConfigSchema, normalizarCambios } from "@/lib/reposo/config";
import { estadoPool, repoReposo } from "@/lib/reposo/repositorio";

export const dynamic = "force-dynamic";

async function estado() {
  const [config, pool] = await Promise.all([repoReposo.config(), estadoPool()]);
  // La clave nunca viaja al cliente: solo si está cargada o no
  return { config, pool, claveCargada: !!process.env.UNSPLASH_ACCESS_KEY };
}

// GET /api/admin/reposo — configuración y estado del pool (padres)
export const GET = () => conSesion(() => estado(), { soloPadres: true });

// PATCH /api/admin/reposo — cambia la configuración (tiempos, consulta, tamaño del pool, referencia del catecismo)
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion(async () => {
    const cambios = normalizarCambios(cambiosConfigSchema.parse(body));
    await repoReposo.guardarConfig(cambios);
    return estado();
  }, { soloPadres: true });
}
