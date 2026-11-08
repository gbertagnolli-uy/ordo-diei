// POST { protocolo, baseUrl, apiKey } → { modelos: string[] } (lane 298). Pide al proveedor la lista de modelos disponibles para la clave de la persona.
// Misma conexión segura que el proxy de turnos (https, IP pública validada al conectar, sin redirecciones).
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, noAutorizado } from "@/lib/diario/api";
import { MAX_CLAVE, validarUrlBase } from "@/lib/diario/asistente/proveedores";
import { cabecerasDeModelos, direccionDeModelos, modelosDe, protocoloDe } from "@/lib/diario/asistente/protocolos";
import { mensajeDeFalla, solicitar } from "@/lib/diario/asistente/servidor-proxy";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES_RESPUESTA = 2_000_000;

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const cuerpo = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  let base: string;
  try {
    base = validarUrlBase(typeof cuerpo.baseUrl === "string" ? cuerpo.baseUrl : "").base;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Dirección inválida" }, { status: 400 });
  }
  const apiKey = typeof cuerpo.apiKey === "string" ? cuerpo.apiKey.trim() : "";
  if (!apiKey || apiKey.length > MAX_CLAVE || /[\r\n]/.test(apiKey)) return NextResponse.json({ error: "La clave no es válida" }, { status: 400 });
  const protocolo = protocoloDe(cuerpo.protocolo);
  try {
    const res = await solicitar({ url: direccionDeModelos(protocolo, base), metodo: "GET", headers: cabecerasDeModelos(protocolo, apiKey), senal: AbortSignal.any([req.signal, AbortSignal.timeout(20_000)]) });
    const trozos: Buffer[] = [];
    let total = 0;
    for await (const t of res as AsyncIterable<Buffer>) {
      trozos.push(t);
      total += t.length;
      if (total > MAX_BYTES_RESPUESTA) {
        res.destroy();
        break;
      }
    }
    const texto = Buffer.concat(trozos).toString("utf8");
    const estado = res.statusCode ?? 0;
    if (estado < 200 || estado >= 300) return NextResponse.json({ error: mensajeDeFalla(estado, texto, apiKey) }, { status: 502 });
    let datos: unknown = null;
    try {
      datos = JSON.parse(texto);
    } catch {
      return NextResponse.json({ error: "El proveedor no devolvió una lista de modelos" }, { status: 502 });
    }
    return NextResponse.json({ modelos: modelosDe(datos) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error && e.message ? `No se pudo conectar con el proveedor: ${e.message}` : "No se pudo conectar con el proveedor" }, { status: 502 });
  }
}
