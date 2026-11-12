// M-P3 de la lane 271: dos dispositivos sin red editan la misma página y al reconectar se mezclan;
// una página de más de 900 KB avisa «demasiado grande». node i271mp3.mjs <puerto> <carpeta_capturas>
import { chromium } from "playwright";
const [puerto, dir] = process.argv.slice(2);
const CHROME = "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe";
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: CHROME });
const errores = [];
const ID = Date.now();
const TITULO = `Mezcla ${ID}`;
const ok = (cond, msg) => console.log(cond ? "OK  " : "FALLA", msg);

async function entrar(userId) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && !/Failed to fetch RSC payload/.test(m.text()) && errores.push(`[${userId}] ${m.text().slice(0, 200)}`));
  p.on("pageerror", (e) => errores.push(`[${userId}] pageerror ${e.message.slice(0, 200)}`));
  const r = await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  if (!r.ok()) throw new Error(`login ${userId}: ${r.status()}`);
  return { ctx, p };
}
const lateral = (p) => p.locator('aside[aria-label="Barra lateral"]');
const editor = (p) => p.locator(".bn-editor[contenteditable=true]").first();
async function abrir(p, hash = "") {
  await p.goto(`${base}/dashboard/notas${hash}`, { waitUntil: "networkidle", timeout: 180000 });
  await lateral(p).waitFor({ timeout: 90000 });
  await p.waitForTimeout(4000); // primer sync
}
async function escribirAlFinal(p, txt) {
  await editor(p).click();
  await p.keyboard.press("Control+End");
  await p.keyboard.press("Enter");
  await p.keyboard.type(txt);
  await p.waitForTimeout(800);
}

// A crea la página y la sube
const A = await entrar(3);
await abrir(A.p);
await lateral(A.p).getByRole("button", { name: "Página nueva" }).first().click();
await A.p.locator("#page-title").waitFor({ timeout: 20000 });
await A.p.keyboard.type(TITULO);
await A.p.keyboard.press("Enter");
await A.p.keyboard.type("base común");
await A.p.waitForTimeout(5000);
const hash = "#" + A.p.url().split("#")[1];

// B (otro dispositivo, mismo usuario) la recibe
const B = await entrar(3);
await abrir(B.p, hash);
await B.p.locator("#page-title").waitFor({ timeout: 30000 });
ok((await editor(B.p).textContent())?.includes("base común"), "el segundo dispositivo recibe la página");

// Los dos sin red, cada uno escribe lo suyo
await A.ctx.setOffline(true);
await B.ctx.setOffline(true);
await escribirAlFinal(A.p, `solo A ${ID}`);
await escribirAlFinal(B.p, `solo B ${ID}`);
await A.p.waitForTimeout(2000);

// Reconectan: A primero, después B; luego A vuelve a traer
await A.ctx.setOffline(false);
await A.p.waitForTimeout(6000);
await B.ctx.setOffline(false);
await B.p.waitForTimeout(8000);
await A.p.reload({ waitUntil: "networkidle" });
await A.p.locator("#page-title").waitFor({ timeout: 30000 });
await A.p.waitForTimeout(6000);
const tA = (await editor(A.p).textContent()) ?? "";
const tB = (await editor(B.p).textContent()) ?? "";
await A.p.screenshot({ path: `${dir}/271-mp3-mezcla-A.png` });
ok(tA.includes(`solo A ${ID}`) && tA.includes(`solo B ${ID}`), `A tiene los dos textos tras reconectar`);
ok(tB.includes(`solo A ${ID}`) && tB.includes(`solo B ${ID}`), `B tiene los dos textos tras reconectar`);

// Página de más de 900 KB: avisa y sigue guardada en el dispositivo
await A.p.locator("body").click({ position: { x: 5, y: 5 } });
await A.p.keyboard.press("Control+Alt+n");
await A.p.locator("#page-title").waitFor();
await A.p.keyboard.type(`Grande ${ID}`);
await A.p.waitForTimeout(800);
await editor(A.p).click();
const bloque = "x".repeat(5000);
for (let i = 0; i < 190; i++) {
  await A.p.keyboard.insertText(bloque);
  if (i % 20 === 19) await A.p.keyboard.press("Enter");
}
await A.p.waitForTimeout(8000);
const aviso = A.p.getByText(/demasiado grande/);
const hayAviso = await aviso.first().isVisible().catch(() => false);
if (hayAviso) console.log("aviso:", await aviso.first().textContent());
await A.p.screenshot({ path: `${dir}/271-mp3-grande.png` });
ok(hayAviso, "una página de más de 900 KB muestra el aviso «demasiado grande»");
if (!hayAviso) console.log("texto del lateral:", (await lateral(A.p).textContent())?.slice(0, 400));

console.log("errores:", errores.length ? errores : "ninguno");
await b.close();
