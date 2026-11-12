// M11 de la lane 274: premio grupal (API + pantallas). node i274.mjs <puerto> <carpeta>
import { chromium } from "playwright";
import pg from "pg";
const [puerto, dir] = process.argv.slice(2);
const base = `http://localhost:${puerto}`;
const db = new pg.Client("postgresql://postgres:local@localhost:55432/ordo");
await db.connect();
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
let fallas = 0;
const ok = (c, m) => { if (!c) fallas++; console.log(c ? "OK  " : "FALLA", m); };
const errores = [];
async function sesion(userId, ancho = 1400, alto = 900) {
  const p = await (await b.newContext({ viewport: { width: ancho, height: alto }, timezoneId: "America/Montevideo" })).newPage();
  p.on("pageerror", (e) => errores.push(e.message.slice(0, 160)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errores.push(m.text().slice(0, 160)));
  await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  return p;
}
const api = (p, metodo, cuerpo, ruta = "/api/premio-grupal") => p.request.fetch(`${base}${ruta}`, { method: metodo, data: cuerpo });

// Estado limpio
await q(`UPDATE "Premios_Grupales" SET "Activo" = false`).catch(async () => {
  const cols = await q(`select column_name from information_schema.columns where table_name='Premios_Grupales'`);
  console.log("columnas:", cols.map((c) => c.column_name).join(", "));
  throw new Error("revisar nombre de la columna activo");
});
const juan = await sesion(3);
const papa = await sesion(1);

ok((await api(juan, "POST", { titulo: "un helado", porcentajeMeta: 50, desde: "2026-11-01", hasta: "2026-11-30" })).status() === 403, "un hijo no puede crear (403)");
ok((await api(juan, "GET", undefined, "/api/premio-grupal?todos=1")).status() === 403, "un hijo no ve la lista de administración (403)");
let r = await api(papa, "POST", { titulo: "un helado", porcentajeMeta: 50, desde: "2026-11-01", hasta: "2026-11-30" });
ok(r.status() === 200, `el padre crea un premio (${r.status()})`);
r = await api(papa, "POST", { titulo: "Otro premio", porcentajeMeta: 50, desde: "2026-11-15", hasta: "2026-12-10" });
ok(r.status() === 400 && /activo en esas fechas/.test((await r.json()).error), "no deja dos activos superpuestos");
ok((await api(papa, "POST", { titulo: "x", porcentajeMeta: 50, desde: "2026-11-01", hasta: "2026-11-30" })).status() === 400, "valida el título");

let v = (await (await api(juan, "GET")).json()).premio;
ok(v?.titulo === "un helado" && v.estado === "en-curso" && v.total > 0, `el hijo ve el vigente: ${v?.hechas}/${v?.total} = ${v?.porcentaje}% (${v?.estado})`);

// Pantallas
await juan.goto(`${base}/dashboard/premio-grupal`, { waitUntil: "networkidle", timeout: 180000 });
const tj = await juan.locator("main").last().innerText();
ok(tj.includes("un helado") && tj.includes("50"), "pantalla de la familia: título y meta");
await juan.screenshot({ path: `${dir}/274-familia.png` });
await papa.goto(`${base}/dashboard/admin/premio-grupal`, { waitUntil: "networkidle", timeout: 180000 });
ok((await papa.locator("main").last().innerText()).includes("un helado"), "panel de administración: lista el premio");
await papa.screenshot({ path: `${dir}/274-admin.png` });
await juan.goto(`${base}/dashboard/admin/premio-grupal`, { waitUntil: "networkidle" });
ok(!new URL(juan.url()).pathname.startsWith("/dashboard/admin/premio-grupal") || !(await juan.locator("main").last().innerText()).includes("Archivar"), `el hijo no administra (${new URL(juan.url()).pathname})`);
const cel = await sesion(3, 390, 844);
await cel.goto(`${base}/dashboard/premio-grupal`, { waitUntil: "networkidle" });
const ancho = await cel.evaluate(() => document.documentElement.scrollWidth);
ok(ancho <= 390, `390 px sin desborde (${ancho})`);
await cel.screenshot({ path: `${dir}/274-cel.png` });

// Archivar el vigente
const id1 = (await q(`SELECT id FROM "Premios_Grupales" WHERE "Titulo" = 'un helado' AND "Activo" ORDER BY id DESC LIMIT 1`))[0]?.id;
ok((await api(papa, "PATCH", { id: id1 })).status() === 200, "archivar");
ok((await (await api(juan, "GET")).json()).premio === null, "archivado no se muestra");

// Período terminado con la meta cumplida → un vale por hijo, una sola vez
const t23 = (await q(`SELECT estado FROM "Tareas" WHERE id = 23`))[0].estado;
await q(`UPDATE "Tareas" SET estado = 'Completada' WHERE id = 23`);
r = await api(papa, "POST", { titulo: "ir al cine", porcentajeMeta: 1, desde: "2026-11-01", hasta: "2026-11-05" });
ok(r.status() === 200, "crear un premio ya terminado");
const vales = async () => Number((await q(`SELECT count(*) n FROM "Recompensas" r WHERE r::text LIKE '%Premio grupal · 2026-11-01 al 2026-11-05%'`))[0].n);
const antes = await vales();
v = (await (await api(juan, "GET")).json()).premio;
ok(v?.estado === "logrado", `al abrir después del período se evalúa: ${v?.estado} ${v?.hechas}/${v?.total}`);
const hijos = Number((await q(`SELECT count(*) n FROM "Usuarios" WHERE "Rol_Familiar" IN ('Hijo','Hija')`).catch(() => [{ n: 2 }]))[0].n);
const despues = await vales();
ok(despues - antes === hijos, `un vale por hijo (${despues - antes} de ${hijos})`);
await api(juan, "GET");
await api(papa, "GET", undefined, "/api/premio-grupal?todos=1");
ok((await vales()) === despues, "no se entrega dos veces");

// Limpieza
await q(`UPDATE "Tareas" SET estado = $1 WHERE id = 23`, [t23]);
await q(`DELETE FROM "Recompensas" r WHERE r::text LIKE '%Premio grupal · 2026-11-01 al 2026-11-05%'`);
await q(`DELETE FROM "Premios_Grupales" WHERE "Titulo" IN ('un helado', 'ir al cine')`);

console.log("errores de consola:", errores.length ? errores : "ninguno");
console.log(fallas ? `${fallas} FALLAS` : "TODO OK");
await b.close();
await db.end();
