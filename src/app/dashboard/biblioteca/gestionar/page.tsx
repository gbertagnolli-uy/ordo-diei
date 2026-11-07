export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarEstantes, listarLibros } from "@/lib/biblioteca/servidor";
import { GestionBiblioteca } from "@/components/biblioteca/GestionBiblioteca";

// Gestión de la biblioteca: solo padres (lane 270, D2); un hijo vuelve a la biblioteca.
export default async function GestionarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
  if (!actor.esPadre) redirect("/dashboard/biblioteca");
  const [libros, estantes] = await Promise.all([listarLibros(actor), listarEstantes()]);
  return <GestionBiblioteca libros={libros} estantes={estantes} />;
}
