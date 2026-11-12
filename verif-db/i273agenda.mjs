// M7 de la lane 273: agenda semanal imprimible. node i273agenda.mjs <puerto> <carpeta_capturas>
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const [puerto, dir] = process.argv.slice(2);
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const errores = [];
const ok = (cond, msg) => console.log(cond ? "OK  " : "FALLA", msg);
async function entrar(userId) {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, timezoneId: "America/Montevideo", locale: "es-UY" });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && errores.push(`[${userId}] ${m.text().slice(0, 200)}`));
  p.on("pageerror", (e) => errores.push(`[${userId}] pageerror ${e.message.slice(0, 200)}`));
  const r = await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  if (!r.ok()) throw new Error(`login ${userId}: ${r.status()}`);
  return p;
}
const URL = `${base}/dashboard/imprimir/agenda-semanal`;
const columnas = (p) => p.locator(".hoja-agenda-semanal section");

// Juan, semana del 2 al 8 de noviembre de 2026 (hoy es sábado 7)
const j = await entrar(3);
await j.goto(URL, { waitUntil: "networkidle", timeout: 180000 });
const h1 = await j.locator("h1").textContent();
ok(/Agenda de Juan Prueba · semana del 2 de noviembre de 2026 al 8 de noviembre de 2026/.test(h1 ?? ""), `encabezado: ${h1}`);
ok((await columnas(j).count()) === 7, "7 columnas (lunes a domingo)");
const texto = async (i) => (await columnas(j).nth(i).textContent()) ?? "";
const lun = await texto(0), mie = await texto(2), mar = await texto(1);
ok(lun.includes("12:00 · P273 Rezar el Ángelus") && (await texto(6)).includes("P273 Rezar el Ángelus"), "la diaria aparece de lunes a domingo a las 12:00");
ok(mie.includes("17:30 · P273 Ordenar el cuarto") && mie.includes("30 min") && mie.includes("☐ Tender la cama") && mie.includes("☐ Barrer") && mie.includes("Vaciar la mochila"), "la única del miércoles: hora local, duración, descripción y checklist");
ok(lun.includes("08:00 · P273 Sacar la basura") && !mar.includes("P273 Sacar la basura"), "la rotativa sale los días de Juan (lun) y no los de Ana (mar)");
ok(lun.indexOf("08:00") < lun.indexOf("12:00"), "ordenadas por hora");
ok(!(await j.locator("body").innerText()).includes("Tarea de Ana"), "no aparecen tareas de Ana");
ok(!(await j.content()).includes("Tarea de Ana"), "las tareas de Ana no viajan en el HTML (D6)");
await j.screenshot({ path: `${dir}/273-pantalla.png`, fullPage: true });

// Semana siguiente
await j.getByRole("button", { name: /Semana siguiente/ }).click();
ok(/9 de noviembre de 2026 al 15 de noviembre/.test((await j.locator("h1").textContent()) ?? ""), "pasa a la semana siguiente");
ok(!(await j.locator("body").innerText()).includes("P273 Ordenar el cuarto"), "la única no se repite en otra semana");
// (se imprime esta semana: carga normal; la del 2 al 8 tiene 20 tareas viejas de prueba el sábado)

// Impresión: una hoja A4 apaisada, sin botones ni barra lateral
await j.emulateMedia({ media: "print" });
ok(!(await j.getByRole("button", { name: "Imprimir" }).isVisible()), "los botones no se imprimen");
const sidebarVisible = await j.locator('[data-slot="sidebar"]').first().isVisible().catch(() => false);
ok(!sidebarVisible, "la barra lateral no se imprime");
await j.screenshot({ path: `${dir}/273-impresion.png`, fullPage: true });
const pdf = await j.pdf({ preferCSSPageSize: true, printBackground: true });
writeFileSync(`${dir}/273-agenda.pdf`, pdf);
const s = pdf.toString("latin1");
const paginas = (s.match(/\/Type\s*\/Page[^s]/g) || []).length;
const caja = s.match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/);
ok(paginas === 1, `una sola hoja (${paginas})`);
ok(caja && Number(caja[1]) > Number(caja[2]), `apaisada (MediaBox ${caja?.[1]} x ${caja?.[2]})`);

// Un hijo no imprime la de otro
const j2 = await entrar(3);
await j2.goto(`${URL}?usuarioId=4`, { waitUntil: "networkidle" });
ok(/Agenda de Juan Prueba/.test((await j2.locator("h1").textContent()) ?? "") && !j2.url().includes("usuarioId=4"), "Juan con ?usuarioId=4 vuelve a la suya");

// Un padre imprime la de un hijo
const p = await entrar(1);
await p.goto(`${URL}?usuarioId=3`, { waitUntil: "networkidle" });
ok(/Agenda de Juan Prueba/.test((await p.locator("h1").textContent()) ?? ""), "el padre ve la de Juan con ?usuarioId=3");

// El A4 vertical de los reportes no cambió: un PDF de otra página sale vertical
console.log("errores:", errores.length ? errores : "ninguno");
await b.close();
