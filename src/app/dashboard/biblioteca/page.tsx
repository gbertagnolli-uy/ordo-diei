export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarEstantes, listarLibros } from "@/lib/biblioteca/servidor";
import { BibliotecaVista } from "@/components/biblioteca/BibliotecaVista";

// Biblioteca de la familia (lane 270): todos ven todos los libros; los padres gestionan.
export default async function BibliotecaPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
  const [libros, estantes] = await Promise.all([listarLibros(actor), listarEstantes()]);
  return (
    <BibliotecaVista
      libros={libros}
      estantes={estantes}
      acciones={
        actor.esPadre ? (
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/dashboard/biblioteca/gestionar">
              <Settings2 /> Gestionar
            </Link>
          </Button>
        ) : null
      }
    />
  );
}
