// Convierte public/Imagenes/* a AVIF (máx. 2048 px de lado) en public/habitos/
// y genera src/lib/habitos/imagenes.json con el mapa hábito → imagen.
// Uso: npm run imagenes
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ORIGEN = "public/Imagenes";
const DESTINO = "public/habitos";
const MAX = 2048;

// Archivos con nombre propio → clave del hábito (src/lib/habitos/catalogo.ts)
const POR_NOMBRE = {
  angelus: "angelus",
  rosario: "rosario",
  noche: "completorium",
  loffit: "libro", // "...fiesta-de-los-libros..."
};

await fs.mkdir(DESTINO, { recursive: true });
const archivos = (await fs.readdir(ORIGEN)).filter((f) => /\.(jpe?g|png|webp)/i.test(f)).sort();

const porClave = {};
const paisajes = [];
for (const f of archivos) {
  const base = f.replace(/\..*$/, "").toLowerCase();
  const clave = POR_NOMBRE[base] ?? POR_NOMBRE[base.split("-")[0]];
  const salida = `${clave ?? base}.avif`;
  await sharp(path.join(ORIGEN, f))
    .rotate()
    .resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
    .avif({ quality: 55, effort: 4 })
    .toFile(path.join(DESTINO, salida));
  if (clave) porClave[clave] = `/habitos/${salida}`;
  else paisajes.push(`/habitos/${salida}`);
  console.log(f, "→", salida);
}

await fs.writeFile(
  "src/lib/habitos/imagenes.json",
  JSON.stringify({ porClave, paisajes }, null, 2) + "\n"
);
