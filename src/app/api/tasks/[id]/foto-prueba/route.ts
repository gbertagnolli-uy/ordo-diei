import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { claveDeUrl, guardarImagen, ImagenInvalidaError } from "@/lib/archivos";
import { puedeCompletarTarea } from "@/lib/tareas/permisos";
import { limpiarFotoPruebaHuerfana } from "@/lib/tareas/fotoPruebaServidor";

export const runtime = "nodejs";

const ESTADOS_CERRADOS = ["Completada", "Aprobada", "Esperando_Aprobacion"];

// POST /api/tasks/[id]/foto-prueba — sube y asocia la foto de prueba de una tarea.
// La imagen se comprime y se guarda en la base (igual que el resto de /api/upload); la tarea solo guarda la URL.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const taskId = Number((await params).id);
    if (!Number.isFinite(taskId)) {
      return NextResponse.json({ error: "Tarea inválida" }, { status: 400 });
    }

    const tarea = await prisma.tarea.findUnique({ where: { id: taskId } });
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    if (!puedeCompletarTarea({ id: Number(session.user.id), rolFamiliar: session.user.rolFamiliar }, tarea)) {
      return NextResponse.json({ error: "Solo quien tiene asignada la tarea (o un padre) puede subir la foto" }, { status: 403 });
    }

    if (!tarea.requiereFotoPrueba) {
      return NextResponse.json({ error: "Esta tarea no pide foto de prueba" }, { status: 400 });
    }

    if (ESTADOS_CERRADOS.includes(tarea.estado)) {
      return NextResponse.json({ error: "La tarea ya fue completada o está en revisión" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo faltante" }, { status: 400 });
    }

    const guardada = await guardarImagen(file, { subidoPorId: Number(session.user.id) });
    const fotoAnterior = tarea.fotoPruebaUrl;

    try {
      await prisma.tarea.update({
        where: { id: taskId },
        data: {
          fotoPruebaUrl: guardada.url,
          fotoPruebaSubidaEn: new Date(),
        },
      });
    } catch (error) {
      // Si no se pudo asociar a la tarea, no dejamos el archivo recién subido huérfano
      const clave = claveDeUrl(guardada.url);
      if (clave) await prisma.archivo.deleteMany({ where: { clave } }).catch(() => {});
      throw error;
    }

    if (fotoAnterior && fotoAnterior !== guardada.url) {
      await limpiarFotoPruebaHuerfana(fotoAnterior).catch((error) => {
        console.error("No se pudo limpiar la foto de prueba anterior:", error);
      });
    }

    return NextResponse.json({ ok: true, ...guardada });
  } catch (error) {
    if (error instanceof ImagenInvalidaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error subiendo foto de prueba:", error);
    return NextResponse.json({ error: "No se pudo guardar la foto de prueba" }, { status: 500 });
  }
}
