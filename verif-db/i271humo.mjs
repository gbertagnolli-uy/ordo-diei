// Humo de la lane 271 (editor + store + sync). node i271humo.mjs <puerto> <carpeta_capturas>
import { chromium } from "playwright";
const [puerto, dir] = process.argv.slice(2);
const CHROME = "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe";
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: CHROME });
const errores = [];
const TXT = `Hola humo ${Date.now()}`;

async function entrar(userId) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && errores.push(`[${userId}] ${m.text().slice(0, 300)}`));
  p.on("pageerror", (e) => errores.push(`[${userId}] pageerror ${e.message.slice(0, 300)}`));
  p.on("response", (r) => r.status() >= 400 && errores.push(`[${userId}] ${r.status()} ${r.url()}`));
  const r = await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  if (!r.ok()) throw new Error(`login ${userId}: ${r.status()}`);
  return p;
}
const estado = async (p) => (await p.getByTestId("estado").textContent())?.trim();

const a = await entrar(3);
await a.goto(`${base}/dashboard/notas-humo`, { waitUntil: "networkidle", timeout: 180000 });
await a.locator(".bn-editor").first().waitFor({ timeout: 60000 });
console.log("A al abrir:", await estado(a));
await a.locator(".bn-editor").first().click();
await a.keyboard.type(TXT);
await a.keyboard.press("Enter");
await a.keyboard.type("/");
await a.locator("#bn-suggestion-menu").waitFor({ timeout: 10000 });
await a.waitForTimeout(600);
console.log("opacidad del menú:", await a.locator("#bn-suggestion-menu").evaluate((e) => getComputedStyle(e).opacity + " / " + getComputedStyle(e).backgroundColor));
await a.screenshot({ path: `${dir}/271-humo-slash.png` });
const grupos = await a.locator(".bn-suggestion-menu-label").allTextContents();
console.log("grupos del menú /:", grupos.join(" | "));
await a.keyboard.press("Escape");
await a.waitForTimeout(4000);
console.log("A después de escribir:", await estado(a));
await a.screenshot({ path: `${dir}/271-humo-a.png` });

// Recargar: lo escrito sigue (IndexedDB)
await a.reload({ waitUntil: "networkidle" });
await a.locator(".bn-editor").first().waitFor({ timeout: 60000 });
console.log("A recargado contiene el texto:", (await a.locator(".bn-editor").first().textContent())?.includes(TXT));

// Otro navegador (IndexedDB vacía), mismo usuario: llega por el sync
const b2 = await entrar(3);
await b2.goto(`${base}/dashboard/notas-humo`, { waitUntil: "networkidle", timeout: 180000 });
await b2.waitForTimeout(5000);
const enB = await b2.locator("body").textContent();
console.log("B (otro navegador) ve el texto:", enB?.includes(TXT), "·", await estado(b2));

// Otro usuario no lo ve
const c = await entrar(4);
await c.goto(`${base}/dashboard/notas-humo`, { waitUntil: "networkidle", timeout: 180000 });
await c.waitForTimeout(4000);
console.log("Ana ve el texto de Juan:", (await c.locator("body").textContent())?.includes(TXT));

console.log("errores:", errores.length ? errores : "ninguno");
await b.close();
