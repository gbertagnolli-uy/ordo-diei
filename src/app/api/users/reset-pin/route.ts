import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { user } = session;
    const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";
    if (!isParent) {
      return NextResponse.json({ error: "Solo los padres pueden restablecer PINs" }, { status: 403 });
    }

    const { userId, nuevoPin } = await req.json();
    if (typeof userId !== "number" || typeof nuevoPin !== "string" || !/^\d{4,8}$/.test(nuevoPin)) {
      return NextResponse.json({ error: "El PIN debe tener entre 4 y 8 dígitos" }, { status: 400 });
    }

    const objetivo = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!objetivo) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const hash = await bcrypt.hash(nuevoPin, await bcrypt.genSalt(10));
    await prisma.usuario.update({ where: { id: userId }, data: { pinSecretoHash: hash } });

    return NextResponse.json({ message: "PIN restablecido" });
  } catch (error) {
    console.error("Error resetting pin:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
