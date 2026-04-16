import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { login } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { userId, pinSecreto } = await req.json();

    const user = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(pinSecreto, user.pinSecretoHash);

    if (!isValid) {
      return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
    }

    // Eliminamos el hash secreto antes de meter al usuario en la sesión
    const { pinSecretoHash, ...safeUser } = user;

    // Crear sesión JWT manejada por next/cookies
    await login(safeUser);

    // Verificar si tiene premios pendientes
    const entregaPendiente = await prisma.premioEntregado.findFirst({
      where: {
        usuarioId: user.id,
        estado: "Pendiente"
      },
      include: {
        premio: true
      },
      orderBy: { fechaEntrega: "desc" }
    });

    return NextResponse.json({ 
      message: "Login Ok", 
      user: safeUser,
      hasPremioPendiente: !!entregaPendiente,
      premioPendiente: entregaPendiente ? {
        id: entregaPendiente.id,
        titulo: entregaPendiente.premio.titulo,
        cantidad: entregaPendiente.premio.cantidad,
      } : null
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Error en servidor" }, { status: 500 });
  }
}
