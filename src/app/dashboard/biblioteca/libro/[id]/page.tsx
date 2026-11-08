export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { NoEncontradoError } from "@/lib/habitos/server";
import { detalleLibro } from "@/lib/biblioteca/servidor";
import { PageHeader } from "@/components/app/PageHeader";
import { DetalleLibro } from "@/components/biblioteca/DetalleLibro";

// Ficha de un libro con el estado de lectura de quien mira (lane 270).
export default async function LibroPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const libro = await detalleLibro(actor, id).catch((e) => {
    if (e instanceof NoEncontradoError) return null;
    throw e;
  });
  if (!libro) notFound();
  return (
    <>
      <PageHeader group="Biblioteca" groupHref="/dashboard/biblioteca" title={libro.titulo} />
      <DetalleLibro libro={libro} />
    </>
  );
}
