// Importa las carpetas de héroes (una por personaje, con todas sus posturas) a public/companeros/<clave>/<pose>.webp.
// Uso: npm run heroes -- <carpeta Heroes> [--informe]
//   Cada carpeta se llama como el personaje («Dom Pío» → dom-pio). Los archivos vienen con nombres en inglés
//   («Animated_priest_waving_hand_…jpg»): se clasifican por palabras clave en las 6 poses de la app.
//   Las T-pose, las vistas de perfil y las hojas de diseño se descartan. Si hay duplicados se queda el más nuevo.
//   Les quita el fondo con rembg en local (salvo las poses de POSES_CON_FONDO —buenos días, con su cartel— que quedan como vienen) (scripts/quitar-fondo.py, ver vault/QUITAR_FONDO.md), recorta por la
//   transparencia y deja todas las poses de un personaje en el mismo lienzo, a la misma altura, en WebP con alfa.
//   Hace falta Python con rembg: REMBG_PYTHON, o el venv `.venv-rembg` del repo (pip install -r scripts/requirements-rembg.txt).
// Si una pose no sale bien del clasificador, se corrige en CORRECCIONES (clave → pose → texto del nombre del archivo).
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import sharp from "sharp";
import { PERSONAJES, POSES, tieneFondo, type Pose } from "../src/lib/engagement/companero.ts";

const DESTINO = "public/companeros";
const ALTO_FIGURA = 1000;

/** Palabras del nombre del archivo → pose, en orden de prioridad (la primera que coincide gana) */
const REGLAS: { pose: Pose; palabras: string[] }[] = [
  { pose: "abrazo", palabras: ["hugging", "abrazando", "i_missed_you"] },
  { pose: "buenos-dias", palabras: ["waving", "saludando"] },
  { pose: "ensenando", palabras: ["teaching", "explaining", "pointing", "indicando", "gesturing_warmly", "explaining"] },
  { pose: "felicitando", palabras: ["clapping", "cheering", "celebrating", "congratulat", "felicitando", "applauding", "victory", "jumping_for_joy", "saltando-alegria"] },
  { pose: "reflexion", palabras: ["thinking", "reflecting", "contemplating", "thoughtful", "thoughtfully", "pensando"] },
  { pose: "neutral", palabras: ["neutral", "standing_front", "standing_pose", "standing", "character_design", "in_medieval", "in_peasant", "in_historic", "in_15th", "wearing", "heroic_pose", "smiling"] },
];

/** Lo que nunca sirve como pose de la app */
const DESCARTAR = ["t-pose", "t_pose", "t-pose", "side_profile", "in_profile", "standing_in_profile", "design_sheet", "sheet", "atras", "costado", "side_view", "back"];

/** Correcciones manuales después de mirar las hojas de contacto: clave → pose → texto que debe tener el nombre del archivo */
export const CORRECCIONES: Record<string, Partial<Record<Pose, string>>> = {
  // La «neutral» que detectaba el clasificador era de perfil (Padre Santiago) o de espaldas (Vicente)
  "padre-santiago": { neutral: "3D_animated_priest_standing" },
  vicente: { neutral: "Animated_boy_standing_" },
};

export const slug = (nombre: string) => nombre.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Pose a la que corresponde un archivo (null si no sirve) */
export function poseDeArchivo(archivo: string, nombrePersonaje: string): Pose | null {
  const n = path.parse(archivo).name.toLowerCase();
  if (DESCARTAR.some((d) => n.includes(d))) return null;
  // La imagen que se llama como el personaje es su presentación
  if (slug(n.replace(/_?\d{14}.*$/, "")) === slug(nombrePersonaje) || slug(n) === slug(nombrePersonaje)) return "neutral";
  const m = n.replace(/-/g, "_");
  return REGLAS.find((r) => r.palabras.some((p) => m.includes(p)))?.pose ?? null;
}

export type Eleccion = { pose: Pose; archivo: string };

/** Elige una imagen por pose entre las de una carpeta (la presentación primero para la neutral; luego la más nueva) */
export function elegirPoses(archivos: string[], nombrePersonaje: string, correcciones: Partial<Record<Pose, string>> = {}): Eleccion[] {
  const elegidas: Eleccion[] = [];
  for (const { clave: pose } of POSES) {
    const candidatas = archivos.filter((f) => poseDeArchivo(f, nombrePersonaje) === pose);
    const forzada = correcciones[pose];
    const lista = forzada ? archivos.filter((f) => f.toLowerCase().includes(forzada.toLowerCase())) : candidatas;
    if (lista.length === 0) continue;
    const presentacion = lista.find((f) => slug(path.parse(f).name) === slug(nombrePersonaje));
    const masNueva = [...lista].sort().at(-1)!;
    elegidas.push({ pose, archivo: presentacion ?? masNueva });
  }
  return elegidas;
}

/** Python con rembg: REMBG_PYTHON, o el venv del repo (.venv-rembg), o python3 */
const pythonDeRembg = () => process.env.REMBG_PYTHON ?? (existsSync(".venv-rembg/bin/python") ? ".venv-rembg/bin/python" : "python3");

/** Recorta por la transparencia (el rectángulo mínimo de la figura, sin tocar el interior) */
async function figuraDe(png: string) {
  const { data, info } = await sharp(png).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 }).toBuffer({ resolveWithObject: true });
  return { data, ancho: info.width, alto: info.height };
}

/** Las poses que se dejan con su fondo (buenos días, con su cartel): solo se recorta el marco blanco de afuera, sin tocar nada de adentro */
async function figuraConFondo(ruta: string) {
  const origen = await sharp(ruta).rotate().toBuffer();
  const [r, g, b] = await sharp(origen).extract({ left: 2, top: 2, width: 1, height: 1 }).raw().toBuffer();
  const blanco = await sharp(origen).linear([255 / Math.max(r, 200), 255 / Math.max(g, 200), 255 / Math.max(b, 200)], [0, 0, 0]).ensureAlpha().toBuffer();
  const { data, info } = await sharp(blanco).trim({ background: "#ffffff", threshold: 28 }).toBuffer({ resolveWithObject: true });
  return { data, ancho: info.width, alto: info.height };
}

async function importar(carpeta: string, soloInforme: boolean) {
  const personajes = (await fs.readdir(carpeta, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const informe: string[] = [];
  const trabajo = await fs.mkdtemp(path.join(os.tmpdir(), "heroes-"));
  const seleccion = path.join(trabajo, "seleccion");
  const sinFondo = path.join(trabajo, "sin-fondo");
  const elegidasPor = new Map<string, Eleccion[]>();
  const origenes = new Map<string, string>(); // «clave/pose» → archivo original

  for (const nombre of personajes) {
    const clave = slug(nombre);
    const datos = PERSONAJES.find((p) => p.clave === clave);
    const archivos = (await fs.readdir(path.join(carpeta, nombre))).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    if (!datos) {
      console.warn(`${nombre}: no está en el catálogo (PERSONAJES), se saltea`);
      continue;
    }
    // Repetidas (misma imagen generada dos veces): por contenido
    const vistos = new Map<string, string>();
    for (const f of [...archivos].sort()) vistos.set(crypto.createHash("md5").update(await fs.readFile(path.join(carpeta, nombre, f))).digest("hex"), f);
    const unicas = [...vistos.values()];
    const elegidas = elegirPoses(unicas, nombre, CORRECCIONES[clave]);
    informe.push(`${nombre} (${clave}): ${archivos.length} archivos, ${unicas.length} distintos → ${elegidas.map((e) => `${e.pose}=${e.archivo}`).join(" | ") || "ninguna pose"}`);
    if (soloInforme || elegidas.length === 0) continue;
    elegidasPor.set(clave, elegidas);
    // Se copian los originales elegidos (nunca se modifican) para pasarlos juntos por rembg
    await fs.mkdir(path.join(seleccion, clave), { recursive: true });
    for (const e of elegidas) {
      const original = path.join(carpeta, nombre, e.archivo);
      origenes.set(`${clave}/${e.pose}`, original);
      if (!tieneFondo(e.pose)) await fs.copyFile(original, path.join(seleccion, clave, `${e.pose}${path.extname(e.archivo).toLowerCase()}`));
    }
  }
  console.log(informe.join("\n"));
  if (soloInforme || elegidasPor.size === 0) return;

  // Quitar el fondo de todo el lote con un solo modelo cargado (scripts/quitar-fondo.py verifica el alfa de cada PNG)
  execFileSync(pythonDeRembg(), ["scripts/quitar-fondo.py", seleccion, "-o", sinFondo], { stdio: "inherit" });

  for (const [clave, elegidas] of elegidasPor) {
    const figuras = await Promise.all(elegidas.map(async (e) => ({ ...e, ...(tieneFondo(e.pose) ? await figuraConFondo(origenes.get(`${clave}/${e.pose}`)!) : await figuraDe(path.join(sinFondo, clave, `${e.pose}.png`))) })));
    // Todas las poses a la misma altura de figura (las «presentaciones» vienen más cerca que el resto) y sobre el mismo lienzo
    const escalas = figuras.map((m) => ALTO_FIGURA / m.alto);
    const ancho = Math.round(Math.max(...figuras.map((m, i) => m.ancho * escalas[i]))) + 16;
    // Solo se reemplazan las poses: el objeto del héroe (objeto.webp) no se toca
    await fs.mkdir(path.join(DESTINO, clave), { recursive: true });
    for (const { clave: pose } of POSES) await fs.rm(path.join(DESTINO, clave, `${pose}.webp`), { force: true });
    for (const [i, m] of figuras.entries()) {
      const figura = await sharp(m.data).resize({ width: Math.round(m.ancho * escalas[i]), height: ALTO_FIGURA }).toBuffer();
      // Lienzo transparente común, apoyado abajo y centrado, para que no «salte» al cambiar de pose
      await sharp({ create: { width: ancho, height: ALTO_FIGURA + 8, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: figura, gravity: "south" }])
        .webp({ quality: 85, alphaQuality: 92 })
        .toFile(path.join(DESTINO, clave, `${m.pose}.webp`));
    }
  }
  await fs.rm(trabajo, { recursive: true, force: true });
  console.log(`Listo: ${elegidasPor.size} héroes en ${DESTINO}/`);
}

if (process.argv[1]?.endsWith("importar-heroes.ts")) {
  const [carpeta, ...banderas] = process.argv.slice(2);
  if (!carpeta) {
    console.error("Uso: npm run heroes -- <carpeta Heroes> [--informe]");
    process.exit(1);
  }
  importar(carpeta, banderas.includes("--informe")).catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
