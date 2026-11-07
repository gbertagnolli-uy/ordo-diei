// POST form-data { post: JSON de PostCreate, files: imágenes } → Post. Lane 276: las imágenes se guardan con
// guardarImagen (como /api/upload); los videos esperan a la lane 277 (D4).
import { NextRequest, NextResponse } from "next/server";
import { guardarImagen } from "@/lib/archivos";
import { actorDeSesion, fallo } from "@/lib/social/servidor/http";
import { EntradaInvalidaError } from "@/lib/social/servidor/canales";
import { crearPost } from "@/lib/social/servidor/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ARCHIVOS = 4;

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const form = await req.formData();
    let datos: Record<string, unknown> = {};
    try {
      datos = JSON.parse(String(form.get("post") ?? "{}"));
    } catch {
      throw new EntradaInvalidaError("Datos del post inválidos");
    }
    const archivos = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (archivos.length > MAX_ARCHIVOS) throw new EntradaInvalidaError(`Máximo ${MAX_ARCHIVOS} fotos por post`);
    if (archivos.some((f) => !f.type.startsWith("image/"))) throw new EntradaInvalidaError("Por ahora solo se pueden subir fotos");
    const urls: string[] = [];
    for (const f of archivos) urls.push((await guardarImagen(f, { subidoPorId: actor.id, perfil: "general" })).url);
    return NextResponse.json(await crearPost(actor, datos, urls), { status: 201 });
  } catch (e) {
    return fallo(e);
  }
}
