import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const isParent = session.user.rolFamiliar === "Padre" || session.user.rolFamiliar === "Madre";
    if (!isParent) return NextResponse.json({ error: "Prohibido" }, { status: 403 });

    const { textoEstricto } = await req.json();

    // Actualizamos o creamos el ID 1 de Reglas
    const regla = await prisma.reglaHogar.findFirst();
    if (regla) {
      await prisma.reglaHogar.update({
        where: { id: regla.id },
        data: { textoEstricto: textoEstricto, actualizadoPorId: session.user.id }
      });
    } else {
      await prisma.reglaHogar.create({
        data: { textoEstricto: textoEstricto, actualizadoPorId: session.user.id }
      });
    }

    revalidatePath("/dashboard/rules");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
