import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.usuario.findMany();
    
    // Regla de Negocio dictada en la Arquitectura: 
    // Los hijos se renderizan ordenados estrictamente de mayor a menor edad (usando Fecha_Nacimiento).
    // Padres primero.
    const sortedUsers = users.sort((a, b) => {
      const isParent = (role: string) => role === "Padre" || role === "Madre";
      
      if (isParent(a.rolFamiliar) && !isParent(b.rolFamiliar)) return -1;
      if (!isParent(a.rolFamiliar) && isParent(b.rolFamiliar)) return 1;
      
      // Si ambos son hijos o ambos son padres, ordenamos por nacimiento (más viejo primero = menor fecha)
      return new Date(a.fechaNacimiento).getTime() - new Date(b.fechaNacimiento).getTime();
    });

    return NextResponse.json(sortedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, pinSecreto, fechaNacimiento, rolFamiliar, fotoUrl } = await req.json();

    // Hashing del PIN_Secreto como pide la req
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pinSecreto, salt);

    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        pinSecretoHash: hash,
        fechaNacimiento: new Date(fechaNacimiento),
        rolFamiliar,
        fotoUrl
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
  }
}
