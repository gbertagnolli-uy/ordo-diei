import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// No cache para permitir actualizaciones en tiempo real del frontend
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const regla = await prisma.reglaHogar.findFirst();
    return NextResponse.json({ reglas: regla?.textoEstricto || "" });
  } catch {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
