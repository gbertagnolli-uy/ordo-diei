import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { contentTypeDe, urlDeDescarga } from "@/lib/homeschooling/archivoExterno";
import { descargarArchivo, DescargaError } from "@/lib/homeschooling/servidor/descarga";
import { obtenerMaterial } from "@/lib/homeschooling/servidor/materiales";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: el PDF o ePub externo de un material, entregado desde la propia app para poder mostrarlo adentro. La dirección sale del
// material guardado (nunca del pedido) y solo la ve quien puede ver ese material.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Id no válido" }, { status: 400 });
  try {
    const m = await obtenerMaterial({ id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") }, id);
    const url = urlDeDescarga(m);
    if (!url) return NextResponse.json({ error: "Este material no es un PDF ni un ePub con enlace" }, { status: 404 });
    const { cuerpo, bytes } = await descargarArchivo(url);
    return new NextResponse(cuerpo, {
      headers: {
        "Content-Type": contentTypeDe(m),
        "Content-Disposition": `inline; filename="${m.tipo === "epub" ? "libro.epub" : "documento.pdf"}"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        ...(bytes !== null ? { "Content-Length": String(bytes) } : {}),
      },
    });
  } catch (e) {
    const status = e instanceof DescargaError ? e.status : ((e as { status?: number }).status ?? 500);
    if (status >= 500 && !(e instanceof DescargaError)) console.error("[Archivo]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: status >= 400 && status < 600 ? status : 500 });
  }
}
