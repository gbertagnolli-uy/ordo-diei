export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { getSession } from "@/lib/session";
import { obtenerDetalleCarta } from "@/lib/cartas/server";
import { DetalleCartaView } from "@/components/cartas/DetalleCartaView";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty";

export default async function DetalleCartaPage({
  params,
}: {
  params: Promise<{ clave: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }

  const { clave } = await params;
  const usuarioId = Number(session.user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const carta = (await obtenerDetalleCarta(usuarioId, clave)) as any;

  if (!carta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 max-w-md mx-auto w-full">
        <Empty className="border rounded-2xl bg-card p-8">
          <EmptyMedia variant="icon">
            <Layers className="size-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Carta no encontrada</EmptyTitle>
            <EmptyDescription>
              La carta solicitada «{clave}» no existe o no se encuentra disponible en el catálogo actual.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm">
              <Link href="/dashboard/cartas">Volver a Mi Colección</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return <DetalleCartaView carta={carta} />;
}
