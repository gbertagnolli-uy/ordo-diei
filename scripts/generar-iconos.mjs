// Íconos de la PWA (lane 204): cuadrado marrón con «OD» en serif, igual que el logo de la barra lateral.
// Uso: node scripts/generar-iconos.mjs  → public/icons/*.png
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const MARRON = "#502300";
const CREMA = "#FBF9F5";

// `margen` deja aire alrededor para el ícono «maskable» (Android recorta el borde)
const svg = (lado, margen) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
  <rect width="${lado}" height="${lado}" fill="${MARRON}"/>
  <text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="${CREMA}"
    font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${Math.round((lado - margen * 2) * 0.5)}">OD</text>
</svg>`;

mkdirSync("public/icons", { recursive: true });
const salidas = [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["icon-maskable-512.png", 512, 80],
  ["apple-touch-icon.png", 180, 0],
];
for (const [archivo, lado, margen] of salidas) {
  await sharp(Buffer.from(svg(lado, margen))).png().toFile(`public/icons/${archivo}`);
  console.log("✓", archivo);
}
