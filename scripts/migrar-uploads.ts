// Pasa las imágenes referenciadas como "/uploads/<archivo>" (disco local, no existen en Vercel)
// a la tabla Archivos y actualiza las referencias. Idempotente: solo toca lo que todavía apunta a /uploads.
// Uso: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/migrar-uploads.ts [carpeta-de-uploads] [respaldo.json]
import fs from "node:fs";
import path from "node:path";
import prisma from "../src/lib/prisma.ts";
import { guardarImagen } from "../src/lib/archivos.ts";

const carpeta = process.argv[2] ?? path.join(process.cwd(), "public", "uploads");
const respaldo = process.argv[3] ?? "migrar-uploads-respaldo.json";

const CAMPOS = [
  { modelo: "usuario", tabla: "Usuarios", campos: ["fotoUrl"] },
  { modelo: "habito", tabla: "Habitos", campos: ["imagen"] },
  { modelo: "carta", tabla: "Cartas", campos: ["imagenUrl", "imagenGrado2Url", "imagenGrado3Url", "imagenGrado4Url"] },
] as const;

const cambios: { tabla: string; id: number; campo: string; antes: string; despues: string }[] = [];
const faltantes: string[] = [];
const yaMigrados = new Map<string, string>();

for (const { modelo, tabla, campos } of CAMPOS) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegado = (prisma as any)[modelo];
  const filas: Record<string, unknown>[] = await delegado.findMany({
    where: { OR: campos.map((c) => ({ [c]: { startsWith: "/uploads/" } })) },
  });
  for (const fila of filas) {
    const data: Record<string, string> = {};
    for (const campo of campos) {
      const antes = fila[campo];
      if (typeof antes !== "string" || !antes.startsWith("/uploads/")) continue;
      let despues = yaMigrados.get(antes);
      if (!despues) {
        const archivo = path.join(carpeta, path.basename(antes));
        if (!fs.existsSync(archivo)) {
          faltantes.push(`${tabla}#${fila.id}.${campo} → ${antes}`);
          continue;
        }
        despues = await guardarImagen(fs.readFileSync(archivo), { nombreOrigen: path.basename(antes) });
        yaMigrados.set(antes, despues);
      }
      data[campo] = despues;
      cambios.push({ tabla, id: fila.id as number, campo, antes, despues });
    }
    if (Object.keys(data).length) await delegado.update({ where: { id: fila.id }, data });
  }
}

fs.writeFileSync(respaldo, JSON.stringify({ fecha: new Date().toISOString(), cambios, faltantes }, null, 2));
console.log(`Migradas ${cambios.length} referencias (${yaMigrados.size} archivos). Faltantes: ${faltantes.length}. Respaldo: ${respaldo}`);
for (const f of faltantes) console.log("  falta:", f);
await prisma.$disconnect();
process.exit(0);
