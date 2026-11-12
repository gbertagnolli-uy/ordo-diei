// M0 de la lane 262: diagnóstico del panel Agenda. node i262diag.mjs <puerto> <carpeta_capturas>
import { chromium } from "playwright";
const [puerto, dir] = process.argv.slice(2);
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const errores = [];

async function panel(p) {
  // El panel es el contenedor cuyo h2 dice "Agenda"
  return p.locator("div.flex.h-full.flex-col", { has: p.locator("h2", { hasText: /^Agenda$/ }) }).last();
}
async function lista(pan) {
  return (await pan.locator("ul li").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
}
async function medidas(p, pan, etiqueta) {
  const caja = await pan.boundingBox();
  const cal = await pan.locator("[data-slot='calendar'], .rdp-root").first().boundingBox().catch(() => null);
  const sa = await pan.locator("[data-slot='scroll-area']").first().boundingBox().catch(() => null);
  // Celdas recortadas: alguna celda/botón del calendario se sale del panel
  const fuera = await pan.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [...el.querySelectorAll("table td, table th, nav button, button")]
      .map((c) => c.getBoundingClientRect())
      .filter((c) => c.width > 0 && (c.right > r.right + 0.5 || c.left < r.left - 0.5)).length;
  });
  const overflow = await pan.evaluate((el) => {
    const t = el.querySelector("table");
    return t ? { tabla: Math.round(t.scrollWidth), contenedor: Math.round(t.parentElement.clientWidth) } : null;
  });
  console.log(`[${etiqueta}] panel ${Math.round(caja?.width)}×${Math.round(caja?.height)} · calendario alto ${Math.round(cal?.height)} · lista alto ${Math.round(sa?.height)} · elementos fuera del panel: ${fuera} · tabla ${JSON.stringify(overflow)}`);
}

async function escenario(ancho, alto, etiqueta) {
  const ctx = await b.newContext({ viewport: { width: ancho, height: alto }, locale: "es-UY", timezoneId: "America/Montevideo" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errores.push(`${etiqueta} pageerror ${e.message.slice(0, 160)}`));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errores.push(`${etiqueta} ${m.text().slice(0, 160)}`));
  await p.request.post(`${base}/api/auth/login`, { data: { userId: 3, pinSecreto: "1234" } });
  await p.goto(`${base}/dashboard`, { waitUntil: "networkidle", timeout: 180000 });
  let pan = await panel(p);
  if (!(await pan.isVisible().catch(() => false))) {
    await p.getByRole("button", { name: "Panel de agenda" }).first().click();
    await p.waitForTimeout(800);
    pan = await panel(p);
  }
  if (!(await pan.isVisible().catch(() => false))) {
    console.log(`[${etiqueta}] NO se pudo abrir el panel Agenda`);
    await p.screenshot({ path: `${dir}/262-${etiqueta}-sin-panel.png` });
    await ctx.close();
    return;
  }
  await medidas(p, pan, etiqueta);
  console.log(`[${etiqueta}] (a) sin día:`, await lista(pan));
  await p.screenshot({ path: `${dir}/262-${etiqueta}-a.png` });

  const dia = (n) => pan.locator("table button").filter({ hasText: new RegExp(`^${n}$`) }).first();
  await dia(7).click();
  await p.waitForTimeout(400);
  console.log(`[${etiqueta}] (b) hoy 7:`, await lista(pan));
  await p.screenshot({ path: `${dir}/262-${etiqueta}-b.png` });

  await dia(10).click();
  await p.waitForTimeout(400);
  console.log(`[${etiqueta}] (c) día 10:`, await lista(pan));

  await pan.getByRole("button", { name: /next|siguiente/i }).first().click().catch(() => console.log(`[${etiqueta}] sin botón de mes siguiente`));
  await p.waitForTimeout(400);
  const cap = await pan.locator("table").first().getAttribute("aria-label").catch(() => "?");
  const marcas = await pan.locator("td[class*='after:'], td .after\\:rounded-full, [class*='after:bg-secondary']").count();
  console.log(`[${etiqueta}] (d) mes siguiente: «${cap}», días marcados: ${marcas}`);
  await p.screenshot({ path: `${dir}/262-${etiqueta}-d.png` });
  await ctx.close();
}

await escenario(1440, 900, "1440");
await escenario(1280, 720, "1280");
await escenario(390, 844, "390");
console.log("errores de consola:", errores.length ? errores : "ninguno");
await b.close();
