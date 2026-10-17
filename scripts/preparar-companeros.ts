// Pasa las ilustraciones del compañero (PNG/JPG/WebP) a public/companeros/ en WebP, con el tamaño y el nombre correctos.
// Uso: npm run companeros -- <carpeta con los originales>
// Nombres de origen (vault/COMPANERO_IMAGENES.md):
//   <personaje>-<pose>.png   → public/companeros/<personaje>/<pose>.webp     (madre-isabel-abrazo.png)
//   <personaje>-objeto.png   → public/companeros/<personaje>/objeto.webp     (pedro-objeto.png)
//   (Las carpetas con todas las poses de cada héroe se importan con `npm run heroes`, scripts/importar-heroes.ts.)
//   fondo-<clave>.png        → public/companeros/fondos/<clave>.webp         (fondo-jardin.png)
//   objeto-<clave>.png       → public/companeros/objetos/<clave>.webp        (objeto-veladora.png)
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { CLAVES_PERSONAJE, POSES } from "../src/lib/engagement/companero.ts";
import { ACCESORIOS } from "../src/lib/engagement/accesorios.ts";

const DESTINO = "public/companeros";

/** Dónde va un archivo de origen y a qué tamaño máximo; null si el nombre no corresponde a nada del catálogo */
export function destinoDe(archivo: string): { ruta: string; ancho: number; alto: number } | null {
  const base = path.parse(archivo).name.toLowerCase().replace(/\s+/g, "-");
  // Las claves de los héroes pueden llevar guiones («madre-isabel-abrazo»): se busca por prefijo
  const heroe = CLAVES_PERSONAJE.find((c) => base.startsWith(`${c}-`));
  if (heroe) {
    const resto = base.slice(heroe.length + 1);
    if (resto === "objeto") return { ruta: `${heroe}/objeto.webp`, ancho: 768, alto: 768 };
    return POSES.some((p) => p.clave === resto) ? { ruta: `${heroe}/${resto}.webp`, ancho: 768, alto: 1024 } : null;
  }
  const corte = base.indexOf("-");
  if (corte < 0) return null;
  const grupo = base.slice(0, corte);
  const resto = base.slice(corte + 1);
  if (grupo === "fondo" && ACCESORIOS.some((a) => a.tipo === "fondo" && a.clave === resto)) return { ruta: `fondos/${resto}.webp`, ancho: 768, alto: 1024 };
  if (grupo === "objeto" && ACCESORIOS.some((a) => a.tipo === "objeto" && a.clave === resto)) return { ruta: `objetos/${resto}.webp`, ancho: 512, alto: 512 };
  return null;
}

async function main(carpeta: string | undefined) {
  if (!carpeta) throw new Error("Uso: npm run companeros -- <carpeta con los originales>");
  const archivos = (await fs.readdir(carpeta)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  let hechas = 0;
  for (const f of archivos) {
    const d = destinoDe(f);
    if (!d) {
      console.warn(`Salteado (el nombre no coincide con nada): ${f}`);
      continue;
    }
    const salida = path.join(DESTINO, d.ruta);
    await fs.mkdir(path.dirname(salida), { recursive: true });
    await sharp(path.join(carpeta, f)).rotate().resize({ width: d.ancho, height: d.alto, fit: "inside", withoutEnlargement: true }).webp({ quality: 85, alphaQuality: 90 }).toFile(salida);
    console.log(`${f} → ${salida} (${Math.round((await fs.stat(salida)).size / 1024)} KB)`);
    hechas++;
  }
  console.log(`${hechas} de ${archivos.length} imágenes listas.`);
}

if (process.argv[1]?.endsWith("preparar-companeros.ts")) {
  main(process.argv[2]).catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
