import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Guarda de la integración de Roost (PLAN_INTEGRACION_ROOST §2.2-2.3): nada de lo portado puede depender
// del router/datos/estilos de Roost, y todo componente declara su origen.

const RAIZ = process.cwd();
const DIRS = ["src/lib/homeschooling", "src/components/homeschooling"];
const ESTE = join("src", "lib", "homeschooling", "roost", "guarda.test.ts");

function archivos(dir: string): string[] {
  let salida: string[] = [];
  let entradas: string[];
  try {
    entradas = readdirSync(join(RAIZ, dir));
  } catch {
    return salida;
  }
  for (const e of entradas) {
    const ruta = join(dir, e);
    if (statSync(join(RAIZ, ruta)).isDirectory()) salida = salida.concat(archivos(ruta));
    else if (/\.(ts|tsx)$/.test(e) && ruta !== ESTE) salida.push(ruta);
  }
  return salida;
}

const PROHIBIDO: [string, RegExp][] = [
  ["react-router-dom", /react-router-dom/],
  ["@supabase/", /@supabase\//],
  ["services/supabase", /services\/supabase/],
  ["surface-N", /surface-\d/],
  ["primary-NNN", /primary-\d{2,3}/],
  ["dark:", /dark:/],
];

test("lo portado de Roost no usa router, Supabase ni paleta de Roost", () => {
  const fallos: string[] = [];
  for (const dir of DIRS) {
    for (const f of archivos(dir)) {
      const texto = readFileSync(join(RAIZ, f), "utf8");
      for (const [nombre, re] of PROHIBIDO) if (re.test(texto)) fallos.push(`${relative(RAIZ, f)}: ${nombre}`);
    }
  }
  assert.deepEqual(fallos, []);
});

test("todo .tsx de components/homeschooling declara su origen", () => {
  const fallos: string[] = [];
  for (const f of archivos("src/components/homeschooling").filter((x) => x.endsWith(".tsx"))) {
    const texto = readFileSync(join(RAIZ, f), "utf8");
    if (!texto.includes("Portado de vendor/roost/") && !texto.includes("// Propio de Ordo")) fallos.push(f);
  }
  assert.deepEqual(fallos, []);
});

// Estos módulos los importan componentes del navegador: si arrastran Prisma o el servidor, `next build` falla (pg no corre en el cliente).
const PUROS = [
  "src/lib/homeschooling/video.ts",
  "src/lib/homeschooling/pacing.ts",
  "src/lib/homeschooling/config.ts",
  "src/lib/homeschooling/roost/permisos.ts",
  "src/lib/homeschooling/roost/tipos.ts",
  "src/lib/homeschooling/roost/router.tsx",
  "src/lib/homeschooling/roost/services/http.ts",
  "src/lib/homeschooling/roost/services/module.ts",
  "src/lib/homeschooling/roost/services/group.ts",
];

test("los módulos que usa el navegador no importan Prisma ni el servidor", () => {
  const fallos: string[] = [];
  for (const f of PUROS) {
    const texto = readFileSync(join(RAIZ, f), "utf8");
    for (const m of texto.matchAll(/^(?:import|export)\s(?!type\b)[^;]*?from\s+["']([^"']+)["']/gm)) {
      if (/prisma|habitos\/|servidor\/|\/session/.test(m[1])) fallos.push(`${f}: ${m[1]}`);
    }
  }
  assert.deepEqual(fallos, []);
});
