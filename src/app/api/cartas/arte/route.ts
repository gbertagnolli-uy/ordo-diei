import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rutaEnDiscoArte, rutaPermitida } from "@/lib/cartas/arte";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS: Record<string, string> = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

// GET /api/cartas/arte?ruta=/cartas/<clave>/<N>.webp — arte de una carta (D19)
// Padre o Madre ven cualquier grado (panel de administración); el resto, solo el de su grado actual.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ruta = req.nextUrl.searchParams.get("ruta") ?? "";
  const enDisco = rutaEnDiscoArte(ruta);
  if (!enDisco || !ruta.startsWith("/cartas/")) {
    return NextResponse.json({ error: "Ruta no válida" }, { status: 400 });
  }

  const rol = session.user.rolFamiliar;
  if (rol !== "Padre" && rol !== "Madre") {
    const clave = ruta.split("/")[2];
    const carta = await prisma.carta.findUnique({ where: { clave } });
    if (!carta || !carta.activa) return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });
    const cu = await prisma.cartaUsuario.findUnique({
      where: { usuarioId_cartaId: { usuarioId: Number(session.user.id), cartaId: carta.id } },
    });
    if (rutaPermitida(carta, cu?.fragmentos ?? 0, cu?.gradoReclamado ?? 0) !== ruta) {
      return NextResponse.json({ error: "Todavía no alcanzaste este grado" }, { status: 403 });
    }
  }

  try {
    const archivo = await readFile(path.join(process.cwd(), enDisco));
    return new NextResponse(new Uint8Array(archivo), {
      headers: {
        "Content-Type": TIPOS[enDisco.split(".").pop()!.toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }
}
