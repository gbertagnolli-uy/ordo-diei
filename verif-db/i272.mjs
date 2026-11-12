// Prueba de pantalla de la lane 272 (diario). node i272.mjs <puerto> <carpeta_capturas>
import { chromium } from "playwright";
const [puerto, dir] = process.argv.slice(2);
const CHROME = process.env.CHROME ?? "C:\\Users\\evoxu\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe";
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: CHROME });
const errores = [];
const T = `Prueba ${Date.now()}`;

async function entrar(userId, ancho = 1280) {
  const ctx = await b.newContext({ viewport: { width: ancho, height: 900 } });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && errores.push(`[${userId}] ${m.text()}`));
  p.on("pageerror", (e) => errores.push(`[${userId}] ${e.message}`));
  p.on("response", (r) => r.status() >= 400 && errores.push(`[${userId}] ${r.status()} ${r.url()}`));
  const r = await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  if (!r.ok()) throw new Error(`login ${userId}: ${r.status()}`);
  return p;
}

// 1) Juan escribe una entrada personal con ánimo 4 desde la pantalla
const juan = await entrar(3);
await juan.goto(`${base}/dashboard/diario`, { waitUntil: "networkidle", timeout: 120000 });
await juan.screenshot({ path: `${dir}/272-juan-antes.png` });
await juan.getByRole("button", { name: "Escribir" }).click();
await juan.getByRole("radio", { name: "Bien", exact: true }).click();
await juan.getByPlaceholder("Título (opcional)").fill(T);
await juan.getByPlaceholder("¿Qué pasó hoy?").fill("Hoy probé el diario nuevo.\nSegunda línea.");
await juan.getByRole("button", { name: "Guardar" }).click();
await juan.getByText(T, { exact: true }).waitFor({ timeout: 15000 });
await juan.screenshot({ path: `${dir}/272-juan-despues.png` });
const tarjetas = await juan.locator("article").count();
console.log("juan: tarjetas del día =", tarjetas);

// 2) Editar: cambiar el título
await juan.locator("article", { hasText: T }).getByRole("button", { name: "Editar" }).click();
const titulo = juan.getByPlaceholder("Título (opcional)");
await titulo.fill(`${T} editado`);
await juan.getByRole("button", { name: "Guardar" }).click();
await juan.getByText(`${T} editado`, { exact: true }).waitFor({ timeout: 15000 });
console.log("juan: edición OK");

// 3) Papá ve el diario familiar; el personal de Juan no aparece en el suyo
const papa = await entrar(1);
await papa.goto(`${base}/dashboard/diario`, { waitUntil: "networkidle", timeout: 120000 });
console.log("papá ve 'Día de prueba editado' en SU personal:", await papa.getByText(`${T} editado`, { exact: true }).count());
await papa.goto(`${base}/dashboard/diario/familia`, { waitUntil: "networkidle", timeout: 120000 });
await papa.screenshot({ path: `${dir}/272-papa-familia.png` });

// 4) Celular 360 px: sin desborde horizontal, hoja usable
const cel = await entrar(3, 360);
await cel.goto(`${base}/dashboard/diario`, { waitUntil: "networkidle", timeout: 120000 });
const desborde = await cel.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log("360px desborde =", desborde);
await cel.screenshot({ path: `${dir}/272-cel.png` });
await cel.getByRole("button", { name: "Escribir" }).click();
await cel.getByPlaceholder("¿Qué pasó hoy?").waitFor();
await cel.waitForTimeout(600);
await cel.screenshot({ path: `${dir}/272-cel-hoja.png` });

console.log("errores de consola:", errores.length ? errores : "ninguno");
await b.close();
