import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { moverDia, omitirDia } from "@/lib/homeschooling/servidor/planes";
import { claveFecha } from "../../_comun";

export const dynamic = "force-dynamic";

const accion = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("mover"), fecha: claveFecha }),
  z.object({ accion: z.literal("omitir") }),
]);

// PATCH /api/homeschooling/dias/[id] { accion: "mover", fecha } | { accion: "omitir" }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const diaId = Number(id);
  const body = await req.json().catch(() => ({}));
  return conSesion(
    async (s) => {
      if (!Number.isInteger(diaId) || diaId <= 0) throw new Error("Día no válido");
      const a = accion.parse(body);
      return a.accion === "mover"
        ? moverDia({ actorId: s.id, diaId, fecha: a.fecha, hoy: hoyEnFamilia() })
        : omitirDia({ actorId: s.id, diaId });
    },
    { soloPadres: true }
  );
}
