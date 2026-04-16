import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

const MOOD_EMOJIS: Record<string, string> = {
  feliz: "😁",
  inspirado: "😍",
  contento: "😊",
  neutral: "😐",
  cansado: "🥱",
  triste: "😔",
  preocupado: "😟",
  enojado: "🤬",
  enfermo: "🤢",
  fiestero: "🥳",
  asustado: "😨",
  aburrido: "😑",
  agradecido: "🥹",
  serio: "🧐",
  tranquilo: "😌",
  ofendido: "😒",
  enamorado: "🥰",
};

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

    const emoji = MOOD_EMOJIS[mood];
    if (!emoji) {
      return NextResponse.json({ error: "Emoji no válido" }, { status: 400 });
    }

    await prisma.usuario.update({
      where: { id: session.user.id },
      data: { moodEmoji: emoji, moodSetAt: new Date() }
    });

    return NextResponse.json({ ok: true, moodEmoji: emoji });
  } catch (error) {
    console.error("Mood API Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
