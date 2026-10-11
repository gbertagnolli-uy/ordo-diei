// Carga idempotente del catálogo de cartas católicas desde JSON (Lane 31)

import fs from "node:fs";
import path from "node:path";
import prisma from "../src/lib/prisma.ts";
import { CONFIG_RAREZAS } from "../src/lib/cartas/economia.ts";
import { esquemaCartaCatalogo, type CartaCatalogo } from "../src/lib/cartas/esquema.ts";

export async function sembrarCartas(directorioCatalogo?: string) {
  const dir =
    directorioCatalogo ||
    path.join(process.cwd(), "src", "lib", "cartas", "catalogo");

  if (!fs.existsSync(dir)) {
    console.log(`[Seed Cartas] Directorio no encontrado: ${dir}`);
    return { insertadas: 0, actualizadas: 0, omitidas: 0, total: 0 };
  }

  const archivos = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"));

  let totalProcesadas = 0;
  let insertadas = 0;
  let actualizadas = 0;
  let omitidas = 0;
  const todasLasClaves = new Set<string>();

  for (const archivo of archivos) {
    const rutaArchivo = path.join(dir, archivo);
    const contenido = fs.readFileSync(rutaArchivo, "utf-8");
    let jsonArray: unknown[];

    try {
      jsonArray = JSON.parse(contenido);
    } catch (e) {
      console.error(`[Seed Cartas] Error al parsear JSON en ${archivo}:`, e);
      continue;
    }

    if (!Array.isArray(jsonArray)) {
      console.warn(`[Seed Cartas] ${archivo} no contiene un array.`);
      continue;
    }

    for (const item of jsonArray) {
      totalProcesadas++;
      const parseResult = esquemaCartaCatalogo.safeParse(item);
      if (!parseResult.success) {
        console.error(
          `[Seed Cartas] Validación fallida para carta en ${archivo}:`,
          parseResult.error.format()
        );
        continue;
      }

      const cartaData: CartaCatalogo = parseResult.data;
      todasLasClaves.add(cartaData.clave);
      const fragmentosReq =
        cartaData.fragmentosRequeridos ??
        CONFIG_RAREZAS[cartaData.rareza].fragmentosRequeridos;

      const resolverImagen = (ruta?: string): string | null => {
        if (!ruta) return null;
        if (ruta.startsWith("http://") || ruta.startsWith("https://") || ruta.startsWith("data:")) {
          return ruta;
        }
        // El arte del catálogo vive en arte-cartas/ (fuera de public/, D19)
        const rutaEnDisco = path.join(process.cwd(), ruta.replace(/^\/cartas\//, "arte-cartas/"));
        return fs.existsSync(rutaEnDisco) ? ruta : null;
      };

      const img1 = resolverImagen(cartaData.imagenes["1"]) ?? cartaData.imagenes["1"];
      const img2 = resolverImagen(cartaData.imagenes["2"]);
      const img3 = resolverImagen(cartaData.imagenes["3"]);
      const img4 = resolverImagen(cartaData.imagenes["4"]);

      const existente = await prisma.carta.findUnique({
        where: { clave: cartaData.clave },
      });

      if (!existente) {
        await prisma.carta.create({
          data: {
            clave: cartaData.clave,
            nombre: cartaData.nombre,
            subtitulo: cartaData.subtitulo ?? null,
            categoria: cartaData.categoria,
            rareza: cartaData.rareza,
            celebracion: cartaData.celebracion ?? null,
            historia: cartaData.historia,
            oracion: cartaData.oracion,
            frase: cartaData.frase,
            fraseAutor: cartaData.fraseAutor ?? null,
            datasheet: cartaData.datasheet,
            imagenUrl: img1,
            imagenGrado2Url: img2,
            imagenGrado3Url: img3,
            imagenGrado4Url: img4,
            creditoImagen: cartaData.creditoImagen ?? null,
            fragmentosRequeridos: fragmentosReq,
            origen: "Sistema",
            editadaManual: false,
            activa: true,
          },
        });
        insertadas++;
      } else if (existente.editadaManual) {
        // No pisar cartas con editadaManual = true
        omitidas++;
      } else {
        // Actualizar datos del sistema y asegurar activa = true
        await prisma.carta.update({
          where: { clave: cartaData.clave },
          data: {
            nombre: cartaData.nombre,
            subtitulo: cartaData.subtitulo ?? null,
            categoria: cartaData.categoria,
            rareza: cartaData.rareza,
            celebracion: cartaData.celebracion ?? null,
            historia: cartaData.historia,
            oracion: cartaData.oracion,
            frase: cartaData.frase,
            fraseAutor: cartaData.fraseAutor ?? null,
            datasheet: cartaData.datasheet,
            imagenUrl: img1,
            imagenGrado2Url: img2,
            imagenGrado3Url: img3,
            imagenGrado4Url: img4,
            creditoImagen: cartaData.creditoImagen ?? null,
            fragmentosRequeridos: fragmentosReq,
            origen: "Sistema",
            activa: true,
          },
        });
        actualizadas++;
      }
    }
  }

  // Desactivar cartas de Sistema que ya no pertenezcan al catálogo JSON (ej. misterios luminosos quitados)
  const desactivadas = await prisma.carta.updateMany({
    where: {
      origen: "Sistema",
      clave: { notIn: Array.from(todasLasClaves) },
      activa: true,
    },
    data: {
      activa: false,
    },
  });

  if (desactivadas.count > 0) {
    console.log(
      `[Seed Cartas] Desactivadas ${desactivadas.count} cartas que ya no forman parte del catálogo.`
    );
  }

  console.log(
    `[Seed Cartas] Finalizado. Total: ${totalProcesadas}, Insertadas: ${insertadas}, Actualizadas: ${actualizadas}, Desactivadas: ${desactivadas.count}, Omitidas por edición manual: ${omitidas}`
  );
  return { insertadas, actualizadas, omitidas, total: totalProcesadas };
}

// Ejecución directa si se invoca con ts-node / node
if (process.argv[1]?.endsWith("seed-cartas.ts")) {
  sembrarCartas()
    .catch((err) => {
      console.error("[Seed Cartas] Error fatal:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
