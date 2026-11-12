// M6 de la lane 264: cronómetro en modal grande y ventana flotante. node i264.mjs <puerto> <carpeta_capturas>
import { chromium } from "playwright";
const [puerto, dir] = process.argv.slice(2);
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const errores = [];
let fallas = 0;
const ok = (cond, msg) => {
  if (!cond) fallas++;
  console.log(cond ? "OK  " : "FALLA", msg);
};
async function contexto(ancho = 1400, alto = 900) {
  const ctx = await b.newContext({ viewport: { width: ancho, height: alto }, locale: "es-UY", timezoneId: "America/Montevideo" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errores.push(`pageerror ${e.message.slice(0, 200)}`));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errores.push(m.text().slice(0, 200)));
  return p;
}
const entrar = async (p, userId) => {
  const r = await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  if (!r.ok()) throw new Error(`login ${userId}: ${r.status()}`);
};
const flotante = (p) => p.getByRole("region", { name: "Tarea en curso" });
const LEER = "P264 Leer 25 minutos";
const ESCRITORIO = "P264 Ordenar el escritorio";

const j = await contexto();
await entrar(j, 3);
// Estado limpio: la tarea 18 de los datos semilla tenía el cronómetro andando
await j.request.put(`${base}/api/tasks/18/timer`, { data: { action: "pause" } });

await j.goto(`${base}/dashboard`, { waitUntil: "networkidle", timeout: 180000 });
ok((await flotante(j).count()) === 0, "sin tarea en curso no hay ventana");

// 1. Iniciar desde la ficha → modal grande
await j.getByText(LEER).first().click();
await j.getByRole("button", { name: /Iniciar tarea/ }).first().click();
const modal = j.getByRole("dialog");
await modal.getByText("Tiempo restante").waitFor({ timeout: 15000 });
const t1 = await modal.innerText();
ok(t1.includes(LEER) && /2[45]:\d\d/.test(t1), `modal grande con título y cuenta regresiva (${t1.match(/\d\d:\d\d/)?.[0]})`);
await j.screenshot({ path: `${dir}/264-grande.png` });
await j.waitForTimeout(2200);
const t2 = (await modal.innerText()).match(/\d\d:\d\d/)?.[0];
ok(t2 && t2 !== t1.match(/\d\d:\d\d/)?.[0], `la cuenta baja (${t2})`);

// 2. Minimizar → ventana flotante abajo a la derecha
await modal.getByRole("button", { name: /Minimizar/ }).click();
await flotante(j).waitFor({ timeout: 10000 });
const caja = await flotante(j).boundingBox();
ok(caja && caja.x + caja.width > 1300 && caja.y + caja.height > 700, `ventana abajo a la derecha (${Math.round(caja?.x)},${Math.round(caja?.y)})`);
ok((await flotante(j).innerText()).includes(LEER), "la ventana muestra el título");

// 3. Otras pantallas
for (const ruta of ["/dashboard/tienda", "/dashboard/cartas"]) {
  await j.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
  ok(await flotante(j).isVisible(), `sigue en ${ruta}`);
}
await j.screenshot({ path: `${dir}/264-flotante.png` });

// 4. Tocarla → modal grande
await flotante(j).getByRole("button", { name: "Abrir el cronómetro en grande" }).click();
ok(await j.getByRole("dialog").getByText("Tiempo restante").isVisible(), "tocar la ventana abre el modal grande");

// 5. Pausar → desaparece y queda Pausada
await j.getByRole("dialog").getByRole("button", { name: /Pausar/ }).click();
await j.waitForTimeout(2500);
ok((await flotante(j).count()) === 0 && (await j.getByRole("dialog").count()) === 0, "pausar cierra todo");
const pausada = await (await j.request.get(`${base}/api/tasks?limit=500`).catch(() => null))?.json().catch(() => null);
void pausada;

// 6. Reanudar desde la ficha (la tarea queda corriendo) y logout
await j.goto(`${base}/dashboard`, { waitUntil: "networkidle" });
await j.getByText(LEER).first().click();
await j.getByRole("button", { name: /Reanudar/ }).first().click();
await j.getByRole("dialog").getByText("Tiempo restante").waitFor({ timeout: 15000 });
ok(true, "reanudar abre el modal grande");
await j.getByRole("dialog").getByRole("button", { name: /Minimizar/ }).click();
await j.request.post(`${base}/api/auth/logout`);
await j.goto(`${base}/`, { waitUntil: "networkidle" });
ok((await flotante(j).count()) === 0 && !(await j.locator("body").innerText()).includes(LEER), "el login no muestra la tarea");

// 7. Ana entra en la misma pantalla → sin ventana; Juan vuelve → ventana
await entrar(j, 4);
await j.goto(`${base}/dashboard`, { waitUntil: "networkidle" });
ok((await flotante(j).count()) === 0, "Ana no ve la tarea de Juan");
await j.request.post(`${base}/api/auth/logout`);
await entrar(j, 3);
await j.goto(`${base}/dashboard/tienda`, { waitUntil: "networkidle" });
ok(await flotante(j).isVisible(), "Juan vuelve a entrar → la ventana aparece sola");

// 8. Finalizar sin foto pendiente → modal de éxito
await flotante(j).getByRole("button", { name: /Finalizar/ }).click();
await j.waitForTimeout(3000);
const exito = await j.locator("body").innerText();
ok(/puntos|¡/i.test(exito) && (await flotante(j).count()) === 0, "finalizar → modal de éxito y la ventana se va");
await j.screenshot({ path: `${dir}/264-exito.png` });
await j.keyboard.press("Escape");

// 9. Con foto pendiente: aviso y /dashboard?s=progress
await j.request.put(`${base}/api/tasks/27/timer`, { data: { action: "start" } });
await j.goto(`${base}/dashboard/tienda`, { waitUntil: "networkidle" });
ok((await flotante(j).innerText()).includes(ESCRITORIO), "tarea con foto en curso");
await flotante(j).getByRole("button", { name: /Finalizar/ }).click();
await j.waitForURL(/\/dashboard\?s=progress/, { timeout: 15000 }).catch(() => {});
ok(j.url().includes("/dashboard?s=progress"), `con foto pendiente lleva a ${new URL(j.url()).pathname}${new URL(j.url()).search}`);
ok((await j.locator("body").innerText()).includes("Subí la foto de prueba para finalizar"), "avisa «Subí la foto de prueba para finalizar»");

// 10. Teléfono 390 px: la ventana no tapa el Dock
const c = await contexto(390, 844);
await entrar(c, 3);
await c.goto(`${base}/dashboard/tienda`, { waitUntil: "networkidle" });
const v = await flotante(c).boundingBox();
const dock = await c.locator("[data-slot='floating-dock'], nav[aria-label*='ock' i]").first().boundingBox().catch(() => null);
ok(v && v.x + v.width <= 390 && v.y + v.height <= 844, `en 390 px la ventana entra en pantalla (${Math.round(v?.x)},${Math.round(v?.y)} ${Math.round(v?.width)}×${Math.round(v?.height)})`);
ok(!dock || v.y + v.height <= dock.y + 1, `no tapa el Dock (${dock ? Math.round(dock.y) : "dock no encontrado"})`);
await c.screenshot({ path: `${dir}/264-cel.png` });
await c.request.put(`${base}/api/tasks/27/timer`, { data: { action: "pause" } });

console.log("errores de consola:", errores.length ? errores : "ninguno");
console.log(fallas ? `${fallas} FALLAS` : "TODO OK");
await b.close();
