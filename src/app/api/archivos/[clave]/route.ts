import { NextRequest, NextResponse } from "next/server";
import { leerArchivo, urlArchivo } from "@/lib/archivos";

export const runtime = "nodejs";

// GET /api/archivos/<uuid> — imagen o archivo subido por un usuario.
// Sin sesión a propósito: las fotos de perfil se ven en la pantalla de ingreso. La clave es un UUID
// imposible de adivinar, y el arte de cartas de grados no alcanzados nunca se envía a quien no lo tiene (D19).
export async function GET(req: NextRequest, { params }: { params: Promise<{ clave: string }> }) {
  const archivo = await leerArchivo(urlArchivo((await params).clave));
  if (!archivo) return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  const descargar = req.nextUrl.searchParams.get("descargar") === "1";
  const nombre = (archivo.nombreOrigen ?? "archivo").replace(/["\r\n]/g, "");
  return new NextResponse(new Uint8Array(archivo.datos), {
    headers: {
      "Content-Type": archivo.tipo,
      ...(descargar ? { "Content-Disposition": `attachment; filename="${encodeURIComponent(nombre)}"` } : {}),
      // El contenido de una clave nunca cambia
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
