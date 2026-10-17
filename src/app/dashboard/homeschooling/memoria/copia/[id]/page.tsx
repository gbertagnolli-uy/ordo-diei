export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import HojaCopia from "@/components/homeschooling/memoria/HojaCopia";

// Hoja para copiar a mano una oración o lista de la memoria (padres)
export default async function CopiaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling/memoria");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const m = await prisma.memorizacion.findUnique({ where: { id }, select: { titulo: true, texto: true, alumno: { select: { nombre: true } } } });
  if (!m) notFound();
  return <HojaCopia titulo={m.titulo} texto={m.texto} alumno={m.alumno.nombre} />;
}
