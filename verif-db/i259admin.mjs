// M12 de la lane 259 (parte de administración): node i259admin.mjs <puerto> <carpeta>
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
async function dispositivo(userId, ancho = 1400, alto = 900) {
  const p = await (await b.newContext({ viewport: { width: ancho, height: alto }, timezoneId: "America/Montevideo" })).newPage();
  p.on("pageerror", (e) => errores.push(e.message.slice(0, 160)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errores.push(m.text().slice(0, 160)));
  p.on("dialog", (d) => d.accept());
  await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  return p;
}
const version = async () => (await q(`SELECT "Version" v FROM "Rutina_Familiar" WHERE id = 1`))[0]?.v ?? 0;

await q(`DELETE FROM "Rutina_Familiar"`);
const papa = await dispositivo(1);
// (a) el padre abre horarios con la base vacía → se crea
await papa.goto(`${base}/dashboard/horarios`, { waitUntil: "networkidle", timeout: 180000 });
await papa.waitForTimeout(2000);
ok((await version()) === 1, `(a) se crea la fila al abrir el padre (versión ${await version()})`);

// Tarjeta en el panel de administración
await papa.goto(`${base}/dashboard/admin`, { waitUntil: "networkidle" });
ok((await papa.getByText("Rutina familiar", { exact: true }).count()) >= 1, "tarjeta «Rutina familiar» en el panel");
await papa.getByText("Rutina familiar", { exact: true }).first().click();
await papa.waitForURL(/\/dashboard\/admin\/rutina/, { timeout: 30000 });
await papa.waitForLoadState("networkidle");
const primera = await papa.locator("[aria-label^='Editar ']").first().getAttribute("aria-label");
ok(!!primera, `pantalla de administración con etapas (${primera})`);
await papa.screenshot({ path: `${dir}/259-admin.png` });

// (b) editar una etapa
await papa.locator("[aria-label^='Editar ']").first().click();
const t = papa.locator("#titulo");
await t.fill("Despertar y ofrecer el día (M12)");
await papa.getByRole("button", { name: "Guardar Etapa" }).click();
await papa.waitForTimeout(2000);
ok((await version()) === 2, `(b) editar guarda en el servidor (versión ${await version()})`);
const juan = await dispositivo(3);
await juan.goto(`${base}/dashboard/horarios`, { waitUntil: "networkidle" });
await juan.waitForTimeout(1500);
await juan.getByText("Diaria", { exact: true }).first().click();
await juan.waitForTimeout(800);
ok((await juan.locator("body").innerText()).includes("Despertar y ofrecer el día (M12)"), "(b) el hijo ve la etapa editada");

// Enfoque semanal
await papa.locator("#rutina-enfoque").fill("Semana de la paciencia (M12)");
await papa.getByRole("button", { name: /Guardar semana/ }).click();
await papa.waitForTimeout(1500);
const enf = (await q(`SELECT "Semanal_Config"::text s FROM "Rutina_Familiar" WHERE id = 1`))[0].s;
ok(enf.includes("Semana de la paciencia (M12)") && (await version()) === 3, `guardar la semana (versión ${await version()})`);

// (c) el hijo no administra
ok((await juan.request.post(`${base}/api/rutina`, { data: { etapas: [], semanalConfig: {} } })).status() === 403, "(c) POST como hijo → 403");
await juan.goto(`${base}/dashboard/admin/rutina`, { waitUntil: "networkidle" });
ok(!new URL(juan.url()).pathname.startsWith("/dashboard/admin/rutina"), `el hijo no entra a la pantalla (${new URL(juan.url()).pathname})`);

// (d) navegador nuevo no pisa
const v0 = await version();
const papa2 = await dispositivo(2);
await papa2.goto(`${base}/dashboard/horarios`, { waitUntil: "networkidle" });
await papa2.waitForTimeout(2000);
ok((await version()) === v0, `(d) un navegador nuevo de la madre no cambia la versión (${await version()})`);

// (e) pausar / posponer no cambian la versión
await papa2.getByText("En Vivo", { exact: true }).first().click().catch(() => {});
await papa2.getByRole("button", { name: /Pausar/ }).first().click().catch(() => console.log("  (sin botón Pausar visible)"));
await papa2.waitForTimeout(800);
await papa2.getByRole("button", { name: /\+5 min/ }).first().click().catch(() => console.log("  (sin botón +5 min visible)"));
await papa2.waitForTimeout(1500);
ok((await version()) === v0, `(e) pausar y posponer no cambian la versión (${await version()})`);

// Teléfono
const cel = await dispositivo(1, 390, 844);
await cel.goto(`${base}/dashboard/admin/rutina`, { waitUntil: "networkidle" });
const ancho = await cel.evaluate(() => document.documentElement.scrollWidth);
ok(ancho <= 390, `390 px sin desborde (${ancho})`);
await cel.screenshot({ path: `${dir}/259-admin-cel.png` });

await q(`DELETE FROM "Rutina_Familiar"`);
console.log("errores de consola:", errores.length ? errores : "ninguno");
console.log(fallas ? `${fallas} FALLAS` : "TODO OK");
await b.close();
await db.end();
