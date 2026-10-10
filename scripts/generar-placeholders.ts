// Generador de placeholders sobrios WebP (formato retrato 63:88, 630x880) para el catálogo de cartas (Lane 33)

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const DIR_CATALOGO = path.join(process.cwd(), "src", "lib", "cartas", "catalogo");
const DIR_PUBLIC = path.join(process.cwd(), "arte-cartas"); // fuera de public/ (D19)

const COLORES_POR_CATEGORIA: Record<string, { bg: string; border: string; text: string }> = {
  Misterio: { bg: "#1e1b4b", border: "#6366f1", text: "#e0e7ff" },
  Angel: { bg: "#0f172a", border: "#38bdf8", text: "#f0f9ff" },
  Santo: { bg: "#261710", border: "#f59e0b", text: "#fef3c7" },
  Tema: { bg: "#360c14", border: "#fb7185", text: "#ffe4e6" },
};

function generarPlaceholders() {
  const archivos = fs.readdirSync(DIR_CATALOGO).filter((f) => f.endsWith(".json"));
  let generadas = 0;

  for (const archivo of archivos) {
    const contenido = JSON.parse(fs.readFileSync(path.join(DIR_CATALOGO, archivo), "utf-8"));
    if (!Array.isArray(contenido)) continue;

    for (const carta of contenido) {
      const dirCarta = path.join(DIR_PUBLIC, carta.clave);
      if (!fs.existsSync(dirCarta)) {
        fs.mkdirSync(dirCarta, { recursive: true });
      }

      const rutaWebp = path.join(dirCarta, "1.webp");
      const colores = COLORES_POR_CATEGORIA[carta.categoria] || {
        bg: "#18181b",
        border: "#a1a1aa",
        text: "#fafafa",
      };

      // Si no existe o tiene tamaño mínimo de 44 bytes de la demo, generar placeholder estético
      const necesitaGenerar =
        !fs.existsSync(rutaWebp) || fs.statSync(rutaWebp).size <= 100;

      if (necesitaGenerar) {
        // Escapar texto para magick
        const tituloLimpio = String(carta.nombre).replace(/"/g, '\\"');
        const catLimpia = `${carta.categoria.toUpperCase()} · ${carta.rareza.toUpperCase()}`.replace(/"/g, '\\"');

        const cmd = `magick -size 630x880 xc:"${colores.bg}" \
          -fill none -stroke "${colores.border}" -strokewidth 6 -draw "rectangle 20,20 610,860" \
          -stroke none -fill "${colores.text}" -gravity north -pointsize 22 -annotate +0+60 "${catLimpia}" \
          -pointsize 60 -annotate +0+320 "†" \
          -pointsize 32 -gravity center -annotate +0+80 "${tituloLimpio}" \
          -pointsize 18 -gravity south -annotate +0+50 "Ordo Diei · Arte Provisional Grado I" \
          "${rutaWebp}"`;

        try {
          execSync(cmd);
          generadas++;
        } catch (e) {
          console.error(`Error generando placeholder para ${carta.clave}:`, e);
        }
      }
    }
  }

  console.log(`[Placeholders] Finalizado. Nuevos placeholders generados: ${generadas}`);
}

generarPlaceholders();
