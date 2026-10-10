import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { guardarImagen, ImagenInvalidaError } from "@/lib/archivos";

export const runtime = "nodejs";

// POST /api/upload — sube una imagen y devuelve { url }. Se guarda en la base (lib/archivos.ts).
// Requiere sesión, salvo en la configuración inicial (todavía no hay ningún usuario).
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user && (await prisma.usuario.count()) > 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo faltante" }, { status: 400 });
    }

    const url = await guardarImagen(file, { subidoPorId: session?.user ? Number(session.user.id) : null });
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof ImagenInvalidaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error subiendo imagen:", error);
    return NextResponse.json({ error: "Error al guardar el archivo" }, { status: 500 });
  }
}
