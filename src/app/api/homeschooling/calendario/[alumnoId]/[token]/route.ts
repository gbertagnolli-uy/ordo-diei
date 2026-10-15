import { NextRequest, NextResponse } from "next/server";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { construirIcs } from "@/lib/homeschooling/ics";
import { eventosDelAlumno, tokenValido } from "@/lib/homeschooling/servidor/calendario";

export const dynamic = "force-dynamic";

// GET: calendario .ics del alumno para suscribirse desde Google/Apple Calendar. Se accede con la firma del enlace, sin sesión
export async function GET(_req: NextRequest, { params }: { params: Promise<{ alumnoId: string; token: string }> }) {
  const { alumnoId, token } = await params;
  const id = Number(alumnoId);
  // Misma respuesta si el alumno no existe o la firma no coincide: no se revela cuál de las dos falló
  if (!Number.isInteger(id) || id <= 0 || !tokenValido(id, token)) return new NextResponse("No encontrado", { status: 404 });
  const cal = await eventosDelAlumno(id, hoyEnFamilia());
  if (!cal) return new NextResponse("No encontrado", { status: 404 });
  return new NextResponse(construirIcs(cal.nombre, cal.eventos), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=300", "Content-Disposition": 'inline; filename="estudio.ics"' },
  });
}
