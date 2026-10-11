import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { guardarImagen, ImagenInvalidaError } from "@/lib/archivos";

export const runtime = "nodejs";

// Cambia la foto del usuario en sesión; se ve en todas partes porque todas leen Usuario.fotoUrl.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await req.formData();
    const file = data.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo faltante" }, { status: 400 });
    }
    const { url: fotoUrl } = await guardarImagen(file, { subidoPorId: Number(session.user.id) });
    await prisma.usuario.update({ where: { id: Number(session.user.id) }, data: { fotoUrl } });

    return NextResponse.json({ fotoUrl });
  } catch (error) {
    if (error instanceof ImagenInvalidaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error cambiando foto:", error);
    return NextResponse.json({ error: "Error al guardar la foto" }, { status: 500 });
  }
}
