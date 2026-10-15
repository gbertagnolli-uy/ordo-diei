import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { gradoVisible, imagenDeGrado } from "@/lib/cartas/fragmentos";
import { rutaEnDiscoArte } from "@/lib/cartas/arte";
import { gradoMaximoReal } from "@/lib/cartas/versiones";
import { leerArchivo } from "@/lib/archivos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS: Record<string, string> = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

// GET /api/cartas/<clave>/version?grado=1..4 — arte de una versión para el carrusel del detalle (lane 58).
// Hasta el grado que el usuario tiene reclamado: el arte real. Más allá: una silueta (blanco y negro, muy
// desenfocada y oscura) generada acá, así el arte de los grados superiores nunca llega al navegador (D19).
// Padre o Madre ven siempre el arte real.
export async function GET(req: NextRequest, { params }: { params: Promise<{ clave: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const grado = Number(req.nextUrl.searchParams.get("grado"));
  if (!Number.isInteger(grado) || grado < 1 || grado > 4) {
    return NextResponse.json({ error: "Grado no válido" }, { status: 400 });
  }

  const { clave } = await params;
  const carta = await prisma.carta.findUnique({ where: { clave } });
  if (!carta || !carta.activa) return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });

  const rol = session.user.rolFamiliar;
  let real = rol === "Padre" || rol === "Madre";
  if (!real) {
    const cu = await prisma.cartaUsuario.findUnique({
      where: { usuarioId_cartaId: { usuarioId: Number(session.user.id), cartaId: carta.id } },
    });
    const visible = gradoVisible(cu?.fragmentos ?? 0, carta.fragmentosRequeridos, cu?.gradoReclamado ?? 0);
    real = grado <= gradoMaximoReal(visible);
  }

  const ruta = imagenDeGrado(carta, grado as 1 | 2 | 3 | 4);
  let datos: Buffer | null = null;
  let tipo = "image/webp";
  const enDisco = ruta.startsWith("/cartas/") ? rutaEnDiscoArte(ruta) : null;
  if (enDisco) {
    datos = await readFile(path.join(process.cwd(), enDisco)).catch(() => null);
    tipo = TIPOS[enDisco.split(".").pop()!.toLowerCase()] ?? tipo;
  } else {
    const archivo = await leerArchivo(ruta);
    if (archivo) {
      datos = archivo.datos;
      tipo = archivo.tipo;
    }
  }
  if (!datos) return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });

  if (!real) {
    datos = await sharp(datos).resize({ width: 400 }).grayscale().blur(18).modulate({ brightness: 0.55 }).webp({ quality: 60 }).toBuffer();
    tipo = "image/webp";
  }

  return new NextResponse(new Uint8Array(datos), {
    headers: { "Content-Type": tipo, "Cache-Control": "private, max-age=3600" },
  });
}
