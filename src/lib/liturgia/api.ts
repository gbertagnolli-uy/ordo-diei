// Plantilla común de las rutas /api/liturgia/* (SPEC liturgia §6): sesión, validación de parámetros,
// repositorio real y cabeceras de caché. La lógica de lectura vive en lecturas.ts.
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { repoPrisma } from "./repositorio.ts";
import type { RepoLiturgia } from "./repositorio.ts";
import type { Resultado } from "./parametros.ts";
import type { Lectura } from "./lecturas.ts";

/** Los textos no cambian hasta la próxima generación (SPEC §6). */
const CACHE_OK = "private, max-age=86400";

export type Parametros = URLSearchParams;
export type Respuesta = Lectura<unknown> | { estado: "clave-invalida" };

/** Toma el valor de un `Resultado`; si es un error, corta con 400 (se captura en `manejar`). */
export function exigir<T>(r: Resultado<T>): T {
  if (!r.ok) throw new ErrorParametro(r.error);
  return r.valor;
}

class ErrorParametro extends Error {}

export async function manejar(
  req: NextRequest,
  leer: (repo: RepoLiturgia, sp: Parametros) => Promise<Respuesta>,
): Promise<NextResponse> {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const r = await leer(await repoPrisma(), req.nextUrl.searchParams);
    if (r.estado === "clave-invalida") return NextResponse.json({ error: "clave inválida para ese libro" }, { status: 400 });
    if (r.estado === "no-generado") {
      return NextResponse.json({ estado: "no-generado" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(r, { headers: { "Cache-Control": CACHE_OK } });
  } catch (e) {
    if (e instanceof ErrorParametro) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[liturgia]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
