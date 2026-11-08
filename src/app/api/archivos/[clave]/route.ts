import { NextRequest, NextResponse } from "next/server";
import { leerArchivo, urlArchivo } from "@/lib/archivos";
import { leerRango } from "@/lib/diario/adjuntos";

export const runtime = "nodejs";

// GET /api/archivos/<uuid> — imagen o archivo subido por un usuario.
// Sin sesión a propósito: las fotos de perfil se ven en la pantalla de ingreso. La clave es un UUID
// imposible de adivinar, y el arte de cartas de grados no alcanzados nunca se envía a quien no lo tiene (D19).
// Lane 294: admite `Range` (206) para que Safari/iOS reproduzcan audio y video y se pueda adelantar, y manda
// `nosniff` para que el navegador no reinterprete un archivo subido como otro tipo.
export async function GET(req: NextRequest, { params }: { params: Promise<{ clave: string }> }) {
  const archivo = await leerArchivo(urlArchivo((await params).clave));
  if (!archivo) return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  const descargar = req.nextUrl.searchParams.get("descargar") === "1";
  const nombre = (archivo.nombreOrigen ?? "archivo").replace(/["\r\n]/g, "");
  const total = archivo.datos.length;
  const cabeceras: Record<string, string> = {
    "Content-Type": archivo.tipo,
    ...(descargar ? { "Content-Disposition": `attachment; filename="${encodeURIComponent(nombre)}"` } : {}),
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    // El contenido de una clave nunca cambia
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const rango = leerRango(req.headers.get("range"), total);
  if (rango === "invalido") {
    return new NextResponse(null, { status: 416, headers: { ...cabeceras, "Content-Range": `bytes */${total}` } });
  }
  if (rango) {
    const trozo = archivo.datos.subarray(rango.inicio, rango.fin + 1);
    return new NextResponse(new Uint8Array(trozo), {
      status: 206,
      headers: { ...cabeceras, "Content-Range": `bytes ${rango.inicio}-${rango.fin}/${total}`, "Content-Length": String(trozo.length) },
    });
  }
  return new NextResponse(new Uint8Array(archivo.datos), { headers: { ...cabeceras, "Content-Length": String(total) } });
}
