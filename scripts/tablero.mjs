// Tablero de lanes: lee el frontmatter de cada LANE_NN_*.md del vault global (raíz del proyecto, fuera de git;
// ver ../vault/README.md) y lo muestra ordenado por número. Solo lee: no escribe nada.
// Uso: node scripts/tablero.mjs [--todas]   (por defecto oculta las lanes integradas)
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// El repo principal (ordo-diei/) aunque se corra desde un worktree; el vault está al lado
const comun = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).trim();
const VAULT = join(dirname(dirname(comun)), "vault");
const mostrarTodas = process.argv.includes("--todas");

if (!existsSync(VAULT)) {
  console.error(`No existe el vault en ${VAULT} (ver AGENTS.md, sección «Vault»).`);
  process.exit(1);
}

function frontmatter(texto) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  if (!m) return null;
  const datos = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const k = /^([a-z_]+):\s*(.*)$/.exec(linea);
    if (k) datos[k[1]] = k[2].replace(/\s+#.*$/, "").replace(/^"(.*)"$/, "$1").trim();
  }
  return datos.lane ? datos : null;
}

const filas = readdirSync(VAULT)
  .filter((f) => /^LANE_\d+_.*\.md$/.test(f))
  .map((f) => ({ ...frontmatter(readFileSync(join(VAULT, f), "utf8")), archivo: f }))
  .filter((l) => l.lane && (mostrarTodas || l.estado !== "integrada"))
  .sort((a, b) => Number(a.lane) - Number(b.lane));

if (!filas.length) {
  console.log(`Sin lanes con frontmatter en ${VAULT}.`);
} else {
  const cols = ["lane", "estado", "agente", "actualizado", "rama", "titulo"];
  const w = Object.fromEntries(cols.map((c) => [c, Math.min(60, Math.max(c.length, ...filas.map((f) => String(f[c] ?? "").length)))]));
  const fila = (o) => cols.map((c) => String(o[c] ?? "").slice(0, w[c]).padEnd(w[c])).join("  ");
  console.log(`Vault: ${VAULT}`);
  console.log(fila(Object.fromEntries(cols.map((c) => [c, c.toUpperCase()]))));
  for (const f of filas) console.log(fila(f));
}
