import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MOOD_POR_KEY } from "@/lib/animo";


// PUT /api/users/mood — Set current user's mood
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { mood } = await req.json(); // mood key like "feliz", or null to clear

    if (mood === null || mood === "") {
      // Clear mood
      await prisma.usuario.update({
        where: { id: session.user.id },
        data: { moodEmoji: null, moodSetAt: null }
      });
      return NextResponse.json({ ok: true, moodEmoji: null });
    }

    const m = MOOD_POR_KEY[mood];
    if (!m) {
      return NextResponse.json({ error: "Emoji no válido" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: session.user.id },
        data: { moodEmoji: m.emoji, moodSetAt: new Date() }
      }),
      prisma.registroAnimo.create({
        data: { usuarioId: session.user.id, animo: m.key, puntaje: m.puntaje }
      }),
    ]);

    return NextResponse.json({ ok: true, moodEmoji: m.emoji });
  } catch (error) {
    console.error("Mood API Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
