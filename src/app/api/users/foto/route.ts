import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024;

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
    const ext = EXTENSIONES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Formato no permitido (JPG, PNG, WebP o GIF)" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "La foto no puede superar 5 MB" }, { status: 400 });
    }

    const nombre = `${crypto.randomUUID()}_perfil.${ext}`;
    await writeFile(path.join(process.cwd(), "public", "uploads", nombre), Buffer.from(await file.arrayBuffer()));

    const fotoUrl = `/uploads/${nombre}`;
    await prisma.usuario.update({ where: { id: Number(session.user.id) }, data: { fotoUrl } });

    return NextResponse.json({ fotoUrl });
  } catch (error) {
    console.error("Error cambiando foto:", error);
    return NextResponse.json({ error: "Error al guardar la foto" }, { status: 500 });
  }
}
