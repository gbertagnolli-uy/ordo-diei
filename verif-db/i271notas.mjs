// Humo de /dashboard/notas (lane 271, fase 2f + M-P1). node i271notas.mjs <puerto> <carpeta_capturas>
import { chromium } from "playwright";
const [puerto, dir] = process.argv.slice(2);
const CHROME = "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe";
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: CHROME });
const errores = [];
const ID = Date.now();
const TITULO = `Humo notas ${ID}`;
const TXT = `texto buscable ${ID}`;
const ok = (cond, msg) => console.log(cond ? "OK  " : "FALLA", msg);

async function entrar(userId, viewport = { width: 1280, height: 900 }) {
  const ctx = await b.newContext({ viewport });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && errores.push(`[${userId}] ${m.text().slice(0, 300)}`));
  p.on("pageerror", (e) => errores.push(`[${userId}] pageerror ${e.message.slice(0, 300)}`));
  p.on("response", (r) => r.status() >= 400 && !/companeros|fondos/.test(r.url()) && errores.push(`[${userId}] ${r.status()} ${r.url()}`));
  const r = await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  if (!r.ok()) throw new Error(`login ${userId}: ${r.status()}`);
  return p;
}
const lateral = (p) => p.locator('aside[aria-label="Barra lateral"]');

const a = await entrar(3);
await a.goto(`${base}/dashboard/notas`, { waitUntil: "networkidle", timeout: 180000 });
await lateral(a).waitFor({ timeout: 90000 });
await a.waitForTimeout(2500);
await a.screenshot({ path: `${dir}/271-notas-inicio.png` });
ok(await a.getByText(/Elegí una página|Todavía no tenés notas/).isVisible(), "inicio sin página abierta");

// Página nueva desde el lateral: el cursor va al título
await lateral(a).getByRole("button", { name: "Página nueva" }).first().click();
await a.locator("#page-title").waitFor({ timeout: 20000 });
await a.keyboard.type(TITULO);
await a.keyboard.press("Enter");
await a.keyboard.type(TXT);
await a.waitForTimeout(1500);
ok(/#p-/.test(a.url()), `la dirección lleva #p-<id> (${a.url().split("#")[1]})`);
ok(await lateral(a).getByText(TITULO).isVisible(), "la página aparece en el árbol del lateral");
await a.screenshot({ path: `${dir}/271-notas-pagina.png` });

// Subpágina desde el árbol
const fila = lateral(a).locator('li[role="treeitem"]', { hasText: TITULO }).first();
await fila.hover();
await fila.getByRole("button", { name: `Agregar una página dentro de ${TITULO}` }).click();
await a.locator("#page-title").waitFor();
await a.keyboard.type(`Hija ${ID}`);
await a.waitForTimeout(1200);
ok((await a.locator('nav[aria-label="Ruta"]').textContent())?.includes(TITULO), "la subpágina muestra la ruta con la madre");

// Búsqueda con Ctrl+K
await a.keyboard.press("Control+k");
await a.getByPlaceholder("Buscá páginas o escribí un comando").waitFor();
await a.keyboard.type(`buscable ${ID}`);
await a.waitForTimeout(600);
const hit = a.locator("[cmdk-item]", { hasText: TITULO });
ok((await hit.count()) > 0, "la paleta encuentra la página por su texto");
await a.screenshot({ path: `${dir}/271-notas-paleta.png` });
await hit.first().click();
await a.waitForTimeout(800);
ok((await a.locator("#page-title").inputValue()) === TITULO, "elegir el resultado abre la página");

// Papelera: mover y restaurar
await a.getByRole("button", { name: "Información" }).click();
await a.getByRole("radio", { name: "Acciones" }).or(a.getByRole("button", { name: "Acciones" })).first().click();
await a.getByRole("button", { name: "Mover a la papelera" }).click();
await a.waitForTimeout(800);
ok(!(await lateral(a).getByText(TITULO).isVisible().catch(() => false)), "al borrarla sale del árbol");
await lateral(a).getByRole("button", { name: /Papelera/ }).click();
await a.getByText(TITULO).first().waitFor();
await a.screenshot({ path: `${dir}/271-notas-papelera.png` });
await a.locator("li", { hasText: TITULO }).getByRole("button", { name: "Restaurar" }).click();
await a.waitForTimeout(800);
ok(await lateral(a).getByText(TITULO).isVisible(), "restaurada vuelve al árbol");
await a.waitForTimeout(4000); // deja que el sync empuje

// Otro navegador, mismo usuario
const b2 = await entrar(3);
await b2.goto(`${base}/dashboard/notas`, { waitUntil: "networkidle", timeout: 180000 });
await lateral(b2).waitFor({ timeout: 90000 });
await b2.waitForTimeout(5000);
ok(await lateral(b2).getByText(TITULO).isVisible(), "otro navegador del mismo usuario ve la página (sync)");

// Otro usuario no la ve
const c = await entrar(4);
await c.goto(`${base}/dashboard/notas`, { waitUntil: "networkidle", timeout: 180000 });
await lateral(c).waitFor({ timeout: 90000 });
await c.waitForTimeout(4000);
ok(!(await c.locator("body").textContent())?.includes(TITULO), "Ana no ve la página de Juan");

// Celular: el lateral es un cajón
const m = await entrar(3, { width: 390, height: 844 });
await m.goto(`${base}/dashboard/notas`, { waitUntil: "networkidle", timeout: 180000 });
await lateral(m).waitFor({ state: "attached", timeout: 90000 });
await m.waitForTimeout(3000);
const ancho = await m.evaluate(() => document.documentElement.scrollWidth);
ok(ancho <= 390, `sin desborde horizontal en 390 px (${ancho})`);
await m.screenshot({ path: `${dir}/271-notas-movil.png` });
await m.getByRole("button", { name: "Abrir la barra lateral" }).first().click();
await m.waitForTimeout(600);
await m.screenshot({ path: `${dir}/271-notas-movil-cajon.png` });
ok(await lateral(m).getByText(TITULO).isVisible(), "en el celular el cajón muestra el árbol");

console.log("errores:", errores.length ? errores : "ninguno");
await b.close();
