import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "Archivo faltante" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Normalizar nombre de archivo
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const uniqueName = crypto.randomUUID() + "_" + safeName;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, uniqueName);

    // Guardar en el filesystem (ideal para app local)
    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${uniqueName}` });
  } catch (error) {
    console.error("Error subiendo foto:", error);
    return NextResponse.json({ error: "Error al guardar el archivo" }, { status: 500 });
  }
}
