export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { NoEncontradoError } from "@/lib/habitos/server";
import { detalleLibro } from "@/lib/biblioteca/servidor";
import { PageHeader } from "@/components/app/PageHeader";
import { LectorLibro } from "@/components/biblioteca/LectorLibro";

// Lector de un libro (ePub o PDF) que abre donde lo dejó quien lee (lane 270). ?formato=pdf elige el formato.
export default async function LeerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ formato?: string }> }) {
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
  if (libro.esAudiolibro) redirect(`/dashboard/biblioteca/libro/${id}`);
  return (
    <>
      <PageHeader group="Biblioteca" groupHref="/dashboard/biblioteca" title={libro.titulo} />
      <LectorLibro libro={libro} formato={(await searchParams).formato ?? null} />
    </>
  );
}
