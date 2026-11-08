// GET /api/diario/exportar?tipo=&formato=markdown|csv|json&desde=&hasta=&categoria=<id|ninguna>&fotos=1&unir=1 → archivo para descargar (lane 291)
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { esFormatoExport } from "@/lib/diario/exportar";
import { exportarDiario, leerOpciones } from "@/lib/diario/servidor-exportar";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const TROZO = 256 * 1024;

/** Se responde en streaming: una respuesta común de una función en Vercel no puede pasar de 4,5 MB, y un ZIP con fotos sí. */
function enTrozos(bytes: Uint8Array): ReadableStream<Uint8Array> {
  let pos = 0;
  return new ReadableStream<Uint8Array>({
    pull(controlador) {
      if (pos >= bytes.length) return controlador.close();
      controlador.enqueue(bytes.subarray(pos, pos + TROZO));
      pos += TROZO;
    },
  });
}

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const p = req.nextUrl.searchParams;
  const tipo = tipoDe(p.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  const formato = p.get("formato");
  if (!esFormatoExport(formato)) return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  try {
    const f = await exportarDiario(actor, tipo, leerOpciones(p, formato));
    const bytes = typeof f.datos === "string" ? new TextEncoder().encode(f.datos) : f.datos;
    return new NextResponse(enTrozos(bytes), {
      headers: {
        "Content-Type": f.mime,
        "Content-Disposition": `attachment; filename="${f.nombre}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return fallo(e);
  }
}
