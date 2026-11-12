// Lane 280: marco global de /dashboard. node i280.mjs <puerto> <carpeta> [anchos=1440,390]
// Por pantalla: botones de colapsar visibles (debe ser 1), separación del contenido con el borde izquierdo
// y con la barra, título de las migas, errores de JS y captura.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const [puerto, dir, anchosArg = "1440,390"] = process.argv.slice(2);
const anchos = anchosArg.split(",").map(Number);
const base = `http://localhost:${puerto}`;
mkdirSync(dir, { recursive: true });

const PADRE = [
  "/dashboard", "/dashboard/horarios", "/dashboard/habitos", "/dashboard/mis-premios", "/dashboard/premio-grupal",
  "/dashboard/liturgia", "/dashboard/liturgia/calendarium", "/dashboard/liturgia/rosarium",
  "/dashboard/biblioteca", "/dashboard/biblioteca/gestionar", "LIBRO", "LEER",
  "/dashboard/notas", "/dashboard/diario", "/dashboard/diario/familia",
  "/dashboard/cartas", "/dashboard/cartas/admin", "/dashboard/companero", "/dashboard/tienda",
  "/dashboard/admin", "/dashboard/admin/aprobaciones", "/dashboard/admin/comportamiento", "/dashboard/admin/conducta",
  "/dashboard/admin/hijos", "/dashboard/admin/premio-grupal", "/dashboard/admin/reposo", "/dashboard/admin/rutina",
  "/dashboard/admin/tareas", "/dashboard/admin/tienda", "/dashboard/premios", "/dashboard/tasks/new",
  "/dashboard/users/new", "/dashboard/users/pines", "/dashboard/perfil", "/dashboard/logros", "/dashboard/rules",
  "/dashboard/imprimir/agenda-semanal",
  "/dashboard/homeschooling", "/dashboard/homeschooling/materias", "MATERIA", "/dashboard/homeschooling/plan",
  "/dashboard/homeschooling/semana", "/dashboard/homeschooling/revision", "/dashboard/homeschooling/libreta",
  "/dashboard/homeschooling/lectura", "/dashboard/homeschooling/memoria", "/dashboard/homeschooling/portafolio",
  "/dashboard/homeschooling/horas", "/dashboard/homeschooling/reportes", "/dashboard/homeschooling/neurodivergencia",
  "/dashboard/homeschooling/dias-sin-clase", "/dashboard/homeschooling/muro", "/dashboard/homeschooling/mensajes",
  "/dashboard/homeschooling/boletin",
];
const HIJO = ["/dashboard/homeschooling", "/dashboard/homeschooling/portafolio", "/dashboard/cartas", "/dashboard/tienda"];

const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const resultados = [];

async function medir(p) {
  return p.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const triggers = [...document.querySelectorAll('[data-sidebar="trigger"]')].filter(vis).length;
    const inset = document.querySelector('[data-slot="sidebar-inset"]');
    const barra = [...document.querySelectorAll('[data-sidebar="trigger"]')].find(vis)?.closest("header");
    const titulo = barra ? [...barra.querySelectorAll('[data-slot="breadcrumb-page"]')].filter(vis).map((e) => e.textContent.trim()).join(" | ") : "";
    if (!inset) return { triggers, titulo, izq: null, arriba: null };
    const ir = inset.getBoundingClientRect();
    const piso = barra ? barra.getBoundingClientRect().bottom : ir.top;
    let izq = Infinity, arriba = Infinity;
    const w = document.createTreeWalker(inset, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest("header") === barra || el.closest("#notice-bar,#premio-banner,#reconocimiento-banner,[data-sidebar],[role=dialog]")) continue;
      if (!vis(el)) continue;
      let fijo = false;
      for (let a = el; a && a !== inset; a = a.parentElement) if (getComputedStyle(a).position === "fixed") { fijo = true; break; }
      if (fijo) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) {
        if (r.width === 0 || r.bottom < piso) continue;
        izq = Math.min(izq, r.left - ir.left);
        arriba = Math.min(arriba, r.top - piso);
      }
    }
    return { triggers, titulo, izq: izq === Infinity ? null : Math.round(izq), arriba: arriba === Infinity ? null : Math.round(arriba) };
  });
}

for (const [usuario, rutas] of [[1, PADRE], [3, HIJO]]) {
  for (const ancho of anchos) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: 900 } });
    const p = await ctx.newPage();
    const errores = [];
    p.on("pageerror", (e) => errores.push(e.message.slice(0, 140)));
    await p.request.post(`${base}/api/auth/login`, { data: { userId: usuario, pinSecreto: "1234" } });
    const dinamicas = {};
    for (let ruta of rutas) {
      if (ruta === "LIBRO" || ruta === "LEER") {
        if (!dinamicas.libro) {
          await p.goto(`${base}/dashboard/biblioteca`, { waitUntil: "networkidle", timeout: 180000 });
          dinamicas.libro = await p.locator('a[href^="/dashboard/biblioteca/libro/"]').first().getAttribute("href").catch(() => null);
        }
        if (!dinamicas.libro) { console.log("SIN LIBRO", ruta); continue; }
        ruta = ruta === "LIBRO" ? dinamicas.libro : dinamicas.libro.replace("/libro/", "/leer/");
      }
      if (ruta === "MATERIA") {
        await p.goto(`${base}/dashboard/homeschooling/materias`, { waitUntil: "networkidle", timeout: 180000 });
        const h = await p.locator('a[href^="/dashboard/homeschooling/materias/"]').first().getAttribute("href").catch(() => null);
        if (!h) { console.log("SIN MATERIA"); continue; }
        ruta = h;
      }
      errores.length = 0;
      try {
        await p.goto(base + ruta, { waitUntil: "networkidle", timeout: 180000 });
        await p.waitForTimeout(600);
      } catch (e) { console.log("TIMEOUT", ruta); }
      const m = await medir(p).catch((e) => ({ error: e.message }));
      const nombre = `${usuario}${ruta.replace(/^\/dashboard/, "").replace(/\//g, "_") || "_inicio"}-${ancho}`;
      await p.screenshot({ path: `${dir}/${nombre}.png` }).catch(() => {});
      const fila = { usuario, ancho, ruta, final: p.url().replace(base, ""), ...m, errores: [...errores] };
      resultados.push(fila);
      console.log(JSON.stringify(fila));
    }
    await ctx.close();
  }
}
writeFileSync(`${dir}/resultados.json`, JSON.stringify(resultados, null, 1));
await b.close();
