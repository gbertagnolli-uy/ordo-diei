// Script de carga masiva de festividades tridentinas (1906) con arte del Prado (Lane 61)
// Por defecto se ejecuta en modo DRY-RUN (simulación segura sin tocar la base de datos).
// Para ejecutar la carga real cuando se autorice, usar: --ejecutar

import fs from "node:fs";
import path from "node:path";
import prisma from "../src/lib/prisma.ts";
import { CONFIG_RAREZAS } from "../src/lib/cartas/economia.ts";
import { esquemaCartaCatalogo, type CartaCatalogo } from "../src/lib/cartas/esquema.ts";

export interface PinturaPrado {
  titulo: string;
  autor: string;
  ano: string;
  tecnica: string;
  dimensiones: string;
  url: string;
  pradoId: string;
}

export interface FestividadCartaCatalogo extends CartaCatalogo {
  gradoLiturgico?: string;
  nombreLatin?: string;
  pinturasPrado?: PinturaPrado[];
}

export async function importarFestividades(opciones?: {
  archivoJson?: string;
  ejecutar?: boolean;
  limite?: number;
}) {
  const rutaArchivo =
    opciones?.archivoJson ||
    path.join(process.cwd(), "festividades-tridentinas-1906-prado.json");

  if (!fs.existsSync(rutaArchivo)) {
    console.error(`[Importar Festividades] Archivo no encontrado: ${rutaArchivo}`);
    return { procesadas: 0, validas: 0, insertadas: 0, actualizadas: 0, omitidas: 0 };
  }

  const contenido = fs.readFileSync(rutaArchivo, "utf-8");
  let items: unknown[];
  try {
    items = JSON.parse(contenido);
  } catch (error) {
    console.error(`[Importar Festividades] Error al parsear JSON:`, error);
    return { procesadas: 0, validas: 0, insertadas: 0, actualizadas: 0, omitidas: 0 };
  }

  if (!Array.isArray(items)) {
    console.error(`[Importar Festividades] El archivo no contiene un array.`);
    return { procesadas: 0, validas: 0, insertadas: 0, actualizadas: 0, omitidas: 0 };
  }

  const modoDryRun = !opciones?.ejecutar;
  const limite = opciones?.limite ? Math.min(opciones.limite, items.length) : items.length;
  const itemsProcesar = items.slice(0, limite);

  console.log("================================================================================");
  console.log(`[Importar Festividades] Modo: ${modoDryRun ? "🔍 DRY-RUN (SIMULACIÓN - NO SE MODIFICA LA BD)" : "⚡ EJECUCIÓN REAL (SUBIENDO A BD)"}`);
  console.log(`[Importar Festividades] Archivo: ${rutaArchivo}`);
  console.log(`[Importar Festividades] Festividades en archivo: ${items.length} (procesando ${itemsProcesar.length})`);
  console.log("================================================================================\n");

  let validas = 0;
  let invalidas = 0;
  let conPinturasPrado = 0;
  let totalPinturasPrado = 0;
  let insertadas = 0;
  let actualizadas = 0;
  let omitidas = 0;

  const desgloseRarezas: Record<string, number> = {
    Celestial: 0,
    Perfecta: 0,
    Buena: 0,
    Comun: 0,
  };

  const desgloseCategorias: Record<string, number> = {
    Santo: 0,
    Misterio: 0,
    Angel: 0,
    Tema: 0,
  };

  for (const item of itemsProcesar) {
    const festividad = item as FestividadCartaCatalogo;
    const parseResult = esquemaCartaCatalogo.safeParse(item);

    if (!parseResult.success) {
      invalidas++;
      console.warn(`[Validación Zod Fallida] ${festividad.clave || "sin-clave"}:`, parseResult.error.format());
      continue;
    }

    validas++;
    const cartaData: CartaCatalogo = parseResult.data;
    desgloseRarezas[cartaData.rareza] = (desgloseRarezas[cartaData.rareza] || 0) + 1;
    desgloseCategorias[cartaData.categoria] = (desgloseCategorias[cartaData.categoria] || 0) + 1;

    const pinturas = festividad.pinturasPrado || [];
    if (pinturas.length > 0) {
      conPinturasPrado++;
      totalPinturasPrado += pinturas.length;
    }

    if (!modoDryRun) {
      const fragmentosReq =
        cartaData.fragmentosRequeridos ??
        CONFIG_RAREZAS[cartaData.rareza].fragmentosRequeridos;

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
            imagenUrl: cartaData.imagenes["1"],
            imagenGrado2Url: cartaData.imagenes["2"] ?? null,
            imagenGrado3Url: cartaData.imagenes["3"] ?? null,
            imagenGrado4Url: cartaData.imagenes["4"] ?? null,
            creditoImagen: cartaData.creditoImagen ?? null,
            fragmentosRequeridos: fragmentosReq,
            origen: "Sistema",
            editadaManual: false,
            activa: true,
          },
        });
        insertadas++;
      } else if (existente.editadaManual) {
        omitidas++;
      } else {
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
            imagenUrl: cartaData.imagenes["1"],
            imagenGrado2Url: cartaData.imagenes["2"] ?? null,
            imagenGrado3Url: cartaData.imagenes["3"] ?? null,
            imagenGrado4Url: cartaData.imagenes["4"] ?? null,
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

  console.log("--------------------------------------------------------------------------------");
  console.log("📊 RESUMEN DE LA CARGA:");
  console.log(`- Festividades procesadas:      ${itemsProcesar.length}`);
  console.log(`- Válidas (esquema Zod):        ${validas}`);
  console.log(`- Inválidas:                    ${invalidas}`);
  console.log(`- Con pinturas del Prado:       ${conPinturasPrado} (${((conPinturasPrado / validas) * 100).toFixed(1)}%)`);
  console.log(`- Total de obras del Prado:     ${totalPinturasPrado}`);
  console.log("--------------------------------------------------------------------------------");
  console.log("✨ Desglose por Rareza:");
  console.log(`  * Celestial (Duplex I cl):    ${desgloseRarezas.Celestial}`);
  console.log(`  * Perfecta  (Duplex II cl):   ${desgloseRarezas.Perfecta}`);
  console.log(`  * Buena     (Duplex/Majus):   ${desgloseRarezas.Buena}`);
  console.log(`  * Comun     (Semiduplex/Sim): ${desgloseRarezas.Comun}`);
  console.log("📂 Desglose por Categoría:");
  console.log(`  * Santo:                      ${desgloseCategorias.Santo}`);
  console.log(`  * Misterio:                   ${desgloseCategorias.Misterio}`);
  console.log(`  * Angel:                      ${desgloseCategorias.Angel}`);
  console.log(`  * Tema:                       ${desgloseCategorias.Tema}`);
  console.log("--------------------------------------------------------------------------------");

  if (modoDryRun) {
    console.log("🛡️  ESTADO: DRY-RUN COMPLETADO CON ÉXITO.");
    console.log("    NO SE HA MODIFICADO NINGÚN DATO EN LA BASE DE DATOS.");
    console.log("    Para ejecutar la importación cuando el usuario lo solicite, ejecute:");
    console.log("    npx tsx scripts/importar-festividades.ts --ejecutar\n");
  } else {
    console.log("✅ ESTADO: IMPORTACIÓN A BASE DE DATOS COMPLETADA.");
    console.log(`    Insertadas: ${insertadas} | Actualizadas: ${actualizadas} | Omitidas (editadas a mano): ${omitidas}\n`);
  }

  return {
    procesadas: itemsProcesar.length,
    validas,
    insertadas,
    actualizadas,
    omitidas,
    conPinturasPrado,
    totalPinturasPrado,
  };
}

// Ejecución directa por línea de comandos
if (process.argv[1]?.endsWith("importar-festividades.ts")) {
  const ejecutar = process.argv.includes("--ejecutar");
  const argLimite = process.argv.find((a) => a.startsWith("--limite="));
  const limite = argLimite ? parseInt(argLimite.split("=")[1], 10) : undefined;

  importarFestividades({ ejecutar, limite })
    .catch((err) => {
      console.error("[Importar Festividades] Error fatal:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
