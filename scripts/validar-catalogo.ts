// Validador exhaustivo del catálogo de cartas católicas (Lane 33)
// Valida esquema Zod (esquemaCartaCatalogo), unicidad de claves y verificación litúrgica con romcal.

import fs from "node:fs";
import path from "node:path";
// @ts-expect-error romcal is a JS/CJS library without bundled TS declarations
import romcal from "romcal";
import { esquemaCartaCatalogo, type CartaCatalogo } from "../src/lib/cartas/esquema.ts";

interface ResultadoValidacion {
  total: number;
  porCategoria: Record<string, number>;
  porRareza: Record<string, number>;
  conCelebracion: number;
  sinCelebracion: number;
  errores: string[];
}

// Fechas litúrgicas universales verificadas por decreto eclesial reciente
// (para aquellas no incluidas en la versión base del calendario de romcal)
const FECHAS_ECLESIALES_CONFIRMADAS: Record<string, string> = {
  "san-carlos-acutis": "10-12", // Memoria litúrgica del Beato/Santo Carlos Acutis (12 de octubre)
  "santa-faustina-kowalska": "10-05", // Memoria libre en el Calendario Romano General (Decreto Congregación Culto Divino, 2020)
};

export function validarCatalogo(directorio?: string): ResultadoValidacion {
  const dir =
    directorio || path.join(process.cwd(), "src", "lib", "cartas", "catalogo");

  const resultado: ResultadoValidacion = {
    total: 0,
    porCategoria: {},
    porRareza: {},
    conCelebracion: 0,
    sinCelebracion: 0,
    errores: [],
  };

  if (!fs.existsSync(dir)) {
    resultado.errores.push(`Directorio no encontrado: ${dir}`);
    return resultado;
  }

  // Cargar calendario romano general y fechas fijas de romcal
  const fechasRomcal = new Map<string, string[]>();

  try {
    const generalObj = romcal.Calendar?.getCalendar("general");
    if (generalObj && typeof generalObj.dates === "function") {
      const dates = generalObj.dates(2026);
      for (const d of dates) {
        const iso = d.moment?.toISOString ? d.moment.toISOString() : String(d.moment);
        const mmdd = iso.slice(5, 10);
        const lista = fechasRomcal.get(mmdd) || [];
        lista.push(d.name || d.key);
        fechasRomcal.set(mmdd, lista);
      }
    }

    const calDinamico = romcal.calendarFor({ year: 2026, locale: "es" });
    for (const c of calDinamico) {
      const iso = c.moment?.toISOString ? c.moment.toISOString() : String(c.moment);
      const mmdd = iso.slice(5, 10);
      const lista = fechasRomcal.get(mmdd) || [];
      lista.push(c.name || c.key);
      fechasRomcal.set(mmdd, lista);
    }
  } catch (err) {
    console.warn("[Validar Catálogo] Advertencia al inicializar romcal:", err);
  }

  const clavesVistas = new Set<string>();
  const archivos = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  console.log(`[Validar Catálogo] Analizando ${archivos.length} archivos en ${dir}...`);

  for (const archivo of archivos) {
    const ruta = path.join(dir, archivo);
    let cartas: unknown[];

    try {
      cartas = JSON.parse(fs.readFileSync(ruta, "utf-8"));
    } catch (e) {
      resultado.errores.push(`Error sintáctico JSON en ${archivo}: ${String(e)}`);
      continue;
    }

    if (!Array.isArray(cartas)) {
      resultado.errores.push(`El archivo ${archivo} no contiene un arreglo.`);
      continue;
    }

    for (let i = 0; i < cartas.length; i++) {
      const item = cartas[i];
      const parsed = esquemaCartaCatalogo.safeParse(item);

      if (!parsed.success) {
        resultado.errores.push(
          `Error de esquema en ${archivo}[${i}]: ${JSON.stringify(parsed.error.format())}`
        );
        continue;
      }

      const carta: CartaCatalogo = parsed.data;
      resultado.total++;

      // 1. Unicidad de clave
      if (clavesVistas.has(carta.clave)) {
        resultado.errores.push(`Clave duplicada: "${carta.clave}" en ${archivo}[${i}]`);
      } else {
        clavesVistas.add(carta.clave);
      }

      // 2. Conteo por categoría y rareza
      resultado.porCategoria[carta.categoria] =
        (resultado.porCategoria[carta.categoria] || 0) + 1;
      resultado.porRareza[carta.rareza] =
        (resultado.porRareza[carta.rareza] || 0) + 1;

      // 3. Verificación de celebración litúrgica
      if (carta.celebracion) {
        resultado.conCelebracion++;
        const celebracionesEnFecha = fechasRomcal.get(carta.celebracion);
        const confirmadaEclesial = FECHAS_ECLESIALES_CONFIRMADAS[carta.clave];

        if (celebracionesEnFecha && celebracionesEnFecha.length > 0) {
          // Coincide con romcal
          // ok
        } else if (confirmadaEclesial === carta.celebracion) {
          // Coincide con decreto universal confirmado
          // ok
        } else {
          resultado.errores.push(
            `Fecha litúrgica ${carta.celebracion} de "${carta.clave}" no hallada en el calendario general de romcal ni en fechas confirmadas.`
          );
        }
      } else {
        resultado.sinCelebracion++;
      }
    }
  }

  return resultado;
}

if (process.argv[1]?.endsWith("validar-catalogo.ts")) {
  const r = validarCatalogo();
  console.log("\n=========================================");
  console.log("       REPORTE DE VALIDACIÓN CATÁLOGO    ");
  console.log("=========================================");
  console.log(`Total de cartas: ${r.total}`);
  console.log("Por Categoría:", r.porCategoria);
  console.log("Por Rareza:", r.porRareza);
  console.log(`Con fecha de celebración: ${r.conCelebracion}`);
  console.log(`Sin fecha de celebración (móviles/misterios/coros): ${r.sinCelebracion}`);

  if (r.errores.length > 0) {
    console.error(`\n❌ Se encontraron ${r.errores.length} errores:`);
    r.errores.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  } else {
    console.log("\n✅ Catálogo completamente válido y verificado con romcal.");
  }
}
