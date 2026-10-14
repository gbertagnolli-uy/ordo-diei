import { conSesion } from "@/lib/tienda/http";
import { repoReposo } from "@/lib/reposo/repositorio";
import { refrescarPoolUnsplash } from "@/lib/reposo/unsplash";

export const dynamic = "force-dynamic";

// POST /api/admin/reposo/refrescar — fuerza el refresco del pool («Cargar fotos ahora»)
export const POST = () =>
  conSesion(
    () => refrescarPoolUnsplash(repoReposo, { fetch, accessKey: process.env.UNSPLASH_ACCESS_KEY, log: console.error }),
    { soloPadres: true },
  );
