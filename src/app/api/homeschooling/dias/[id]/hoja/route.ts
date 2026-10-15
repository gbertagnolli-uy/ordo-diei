import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { darImpresionExtraDia, registrarImpresionDia, resumenHojaDia } from "@/lib/homeschooling/servidor/hojaDia";
import { idDe } from "../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// GET: cuántas veces se imprimió la hoja del día y cuántas puede (padres)
export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => resumenHojaDia(s, await idDe(params)), { soloPadres: true });
}

// POST: abre la hoja imprimible del día (gasta una impresión del alumno; un padre imprime sin tope)
export async function POST(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => registrarImpresionDia(s, await idDe(params)));
}

// PUT: le da una impresión más de la hoja al alumno (padres)
export async function PUT(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await darImpresionExtraDia(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
