// Fase D: lo que depende de gestos y del motor de impresión — deslizar para aprobar, arrastrar un día del calendario,
// imprimir el reporte (media print y PDF) y la pausa del video en un checkpoint. Requiere haber corrido fase_a.
import { chromium } from "playwright-core";
import { api, BASE, CHROMIUM, DIR, guardar, leer, prisma, SUFIJO } from "./lib.ts";

const e = leer(); const H = "/dashboard/homeschooling";
const res: { ok: boolean; t: string }[] = [];
const ck = (ok: boolean, t: string) => { res.push({ ok, t }); console.log((ok ? "OK    " : "FALLA ") + t); };
const cp = e.cookies.padre, ch = e.cookies.hijo;
const hasta = async (fn: () => Promise<boolean>, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return true; await new Promise((r) => setTimeout(r, 600)); } return false; };

// --- datos: dos evidencias pendientes (aprobar y pedir ajuste), un curso con 3 días futuros, y un video con checkpoint
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const subir = async () => { const f = new FormData(); f.append("file", new Blob([png], { type: "image/png" }), "x.png"); return (await api(ch, "/api/upload", { form: f })).json.url as string; };
const ev1 = (await api(ch, "/api/homeschooling/evidencias", { body: { titulo: "Deslizar para aprobar", imagenes: [await subir()] } })).json.id as number;
const ev2 = (await api(ch, "/api/homeschooling/evidencias", { body: { titulo: "Deslizar para ajustar", imagenes: [await subir()] } })).json.id as number;
const mat = (await api(cp, "/api/homeschooling/materias", { body: { nombre: `Gestos ${SUFIJO}`, icono: "Brain", color: "warning" } })).json.id as number;
const curCal = (await api(cp, "/api/homeschooling/cursos", { body: { materiaId: mat, titulo: `Calendario ${SUFIJO}`, tipo: "libro", unidadTipo: "pagina", totalUnidades: 6, minutosPorUnidad: 10 } })).json.id as number;
const hoy = new Date(e.hoy + "T12:00:00"); const mas = (n: number) => { const d = new Date(hoy); d.setDate(d.getDate() + n); return d.toLocaleDateString("sv-SE"); };
const pl = await api(cp, "/api/homeschooling/planes", { body: { recursoId: curCal, alumnoId: e.hijoId, inicio: mas(1), fin: mas(14), diasSemana: [1, 2, 3, 4, 5, 6, 7] } });
const curVid = (await api(cp, "/api/homeschooling/cursos", { body: { materiaId: mat, titulo: `Video ${SUFIJO}`, tipo: "curso_videos", unidadTipo: "leccion", minutosPorUnidad: 10 } })).json.id as number;
const lecVid = (await api(cp, "/api/homeschooling/lecciones", { body: { recursoId: curVid, titulo: "Video con pausa", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" } })).json.id as number;
await api(cp, `/api/homeschooling/lecciones/${lecVid}/preguntas`, { method: "PUT", body: { preguntas: [{ enunciado: "¿Viste el video hasta acá?", opciones: ["Sí", "No"], correcta: 0, explicacion: "Seguí mirando", segundoVideo: 3 }] } });
await api(cp, "/api/homeschooling/planes", { body: { recursoId: curVid, alumnoId: e.hijoId, inicio: e.hoy, fin: e.hoy, diasSemana: [1, 2, 3, 4, 5, 6, 7] } });
guardar({ ...e, mat, curCal, curVid, lecVid, ev1, ev2, plCal: pl.json?.plan?.id });

const nav = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const abrir = async (quien: "padre" | "hijo", ancho = 1440, alto = 900) => {
  const ctx = await nav.newContext({ viewport: { width: ancho, height: alto }, locale: "es-UY", timezoneId: "America/Montevideo" });
  await ctx.addCookies([{ name: "session", value: e.cookies[quien], url: BASE }]);
  return { ctx, p: await ctx.newPage() };
};

// ===== deslizar para aprobar / pedir ajuste (SwipeRow)
{
  const { ctx, p } = await abrir("padre", 900, 900);
  await p.setViewportSize({ width: 1400, height: 900 });
  await p.goto(`${BASE}${H}/revision`, { waitUntil: "networkidle" });
  const fila = async (t: string) => { const c = p.locator("li", { hasText: t }).first(); const b = await c.boundingBox(); return { c, b }; };
  // SwipeRow tiene resistencia elástica: para confirmar hay que arrastrar muy lejos (o con un «flick» rápido en el celular)
  const arrastrar = async (t: string, hacia: "izquierda" | "derecha") => {
    const { b } = await fila(t); if (!b) throw new Error(`no hay fila ${t}`);
    const y = b.y + b.height / 2, sentido = hacia === "izquierda" ? -1 : 1, x0 = b.x + b.width * (hacia === "izquierda" ? 0.9 : 0.1);
    await p.mouse.move(x0, y); await p.mouse.down();
    for (let i = 1; i <= 30; i++) { await p.mouse.move(x0 + sentido * i * 40, y); await p.waitForTimeout(8); }
    await p.mouse.up();
  };
  await arrastrar("Deslizar para aprobar", "izquierda");
  ck(await hasta(async () => (await prisma.evidenciaAprendizaje.findUnique({ where: { id: ev1 } }))?.estado === "aprobada"), "deslizar a la izquierda aprueba la evidencia");
  await p.waitForTimeout(800);
  await arrastrar("Deslizar para ajustar", "derecha");
  await p.getByRole("dialog").waitFor({ timeout: 8000 }).catch(() => {});
  ck(await p.getByRole("dialog").getByText("Pedir ajuste").first().isVisible().catch(() => false), "deslizar a la derecha abre «Pedir ajuste»");
  await p.getByRole("dialog").getByRole("textbox").fill("Falta la segunda hoja");
  await p.getByRole("dialog").getByRole("button", { name: "Pedir ajuste" }).click();
  ck(await hasta(async () => (await prisma.evidenciaAprendizaje.findUnique({ where: { id: ev2 } }))?.estado === "ajustar"), "el ajuste con comentario queda guardado");
  await ctx.close();
}

// ===== calendario: los días pendientes están cableados para arrastrarse (la regla de orden la prueba la fase A/planes.test)
{
  const { ctx, p } = await abrir("padre");
  await p.goto(`${BASE}${H}/plan?alumno=${e.hijoId}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const dias = await prisma.diaLectivo.count({ where: { planId: e.plCal } });
  ck(dias >= 3, `el plan de prueba tiene ${dias} días futuros`);
  const cableados = await p.evaluate(() => [...document.querySelectorAll(".rbc-event")].filter((x) => x.textContent?.includes("Calendario")).map((el) => {
    const k = Object.keys(el).find((n) => n.startsWith("__reactProps")); return !!(k && (el as unknown as Record<string, Record<string, unknown>>)[k].onMouseDown);
  }));
  ck(cableados.length >= 3 && cableados.every(Boolean), `los ${cableados.length} días pendientes del mes tienen el manejador de arrastre (onMouseDown)`);
  ck((await p.locator(".rbc-addons-dnd").count()) === 1, "el calendario tiene activo el módulo de arrastre");
  await p.screenshot({ path: `${DIR}/shots/d-calendario.png` });

  // arrastre real con el mouse: un día pendiente a una celda vacía del mismo plan (→ PATCH 200 y la fecha cambia en la base)
  const antes = await prisma.diaLectivo.findMany({ where: { planId: e.plCal, estado: "pendiente" }, orderBy: { fecha: "asc" }, select: { id: true, fecha: true } });
  const ocupadas = new Set(antes.map((d) => d.fecha.toISOString().slice(0, 10)));
  const dest = Array.from({ length: 14 }, (_, i) => mas(i + 1)).find((f) => !ocupadas.has(f) && f.slice(0, 7) === e.hoy.slice(0, 7));
  ck(!!dest, `hay un día vacío del mes para soltar (${dest})`);
  const ev = p.locator(".rbc-event", { hasText: "Calendario" }).first();
  await ev.scrollIntoViewIfNeeded();
  // el dock inferior puede tapar la fila: se deja la fila a media altura
  await p.evaluate(() => window.scrollBy(0, 200));
  const origen = (await ev.boundingBox())!;
  // la celda se localiza por posición en la grilla: se calcula con el primer día visible (la semana empieza el lunes)
  const primero = new Date(dest!.slice(0, 8) + "01T12:00:00"); const offset = (primero.getDay() + 6) % 7;
  const idx = offset + Number(dest!.slice(8, 10)) - 1;
  const objetivo = (await p.locator(".rbc-day-bg").nth(idx).boundingBox())!;
  const respuesta = p.waitForResponse((r) => r.url().includes("/api/homeschooling/dias/") && r.request().method() === "PATCH", { timeout: 15000 }).catch(() => null);
  await p.mouse.move(origen.x + origen.width / 2, origen.y + origen.height / 2);
  await p.mouse.down();
  await p.mouse.move(origen.x + origen.width / 2 + 10, origen.y + origen.height / 2 + 10, { steps: 5 });
  await p.mouse.move(objetivo.x + objetivo.width / 2, objetivo.y + 20, { steps: 25 });
  await p.mouse.up();
  const r = await respuesta;
  ck(r?.status() === 200, `soltar el día en ${dest} manda el PATCH y responde ${r?.status()}`);
  const despues = await prisma.diaLectivo.findMany({ where: { planId: e.plCal, estado: "pendiente" }, select: { fecha: true } });
  ck(despues.some((d) => d.fecha.toISOString().slice(0, 10) === dest), `la base tiene un día pendiente en ${dest} (antes: ${antes.map((d) => d.fecha.toISOString().slice(5, 10)).join(", ")})`);
  await p.screenshot({ path: `${DIR}/shots/d-calendario-arrastrado.png` });

  // destino ocupado: la regla de orden lo rechaza con 4xx y la fecha no cambia
  const ocupado = despues.map((d) => d.fecha.toISOString().slice(0, 10)).filter((f) => f !== dest && f.slice(0, 7) === e.hoy.slice(0, 7))[0];
  if (ocupado) {
    const otro = await prisma.diaLectivo.findFirst({ where: { planId: e.plCal, estado: "pendiente", fecha: { gt: new Date(dest + "T12:00:00Z") } }, orderBy: { fecha: "asc" }, select: { id: true, fecha: true } });
    const rr = otro ? await api(cp, `/api/homeschooling/dias/${otro.id}`, { method: "PATCH", body: { accion: "mover", fecha: dest } }) : null;
    ck(!!rr && rr.status >= 400 && rr.status < 500, `mover un día a una fecha ocupada se rechaza (${rr?.status})`);
  }
  await ctx.close();
}

// ===== imprimir el reporte
{
  const { ctx, p } = await abrir("padre", 1000, 1200);
  await p.goto(`${BASE}${H}/reportes?alumno=${e.hijoId}&tipo=mes`, { waitUntil: "networkidle" });
  await p.emulateMedia({ media: "print" });
  const ocultos = await p.evaluate(() => {
    const oculto = (sel: string) => { const el = document.querySelector(sel); return !el || getComputedStyle(el).display === "none"; };
    return { sidebar: oculto('[data-slot="sidebar-container"]'), gap: oculto('[data-slot="sidebar-gap"]'), cabecera: oculto("header.sticky"), controles: [...document.querySelectorAll("button")].filter((b) => /Imprimir/.test(b.textContent ?? "")).every((b) => getComputedStyle(b.closest("div")!).display === "none" || (b as HTMLElement).offsetParent === null) };
  });
  ck(ocultos.sidebar && ocultos.gap, `al imprimir se ocultan la barra lateral y su espacio (${JSON.stringify(ocultos)})`);
  ck(ocultos.cabecera, "al imprimir se oculta la cabecera con las pestañas de Estudio");
  ck(ocultos.controles, "al imprimir se oculta la fila de controles (alumno, período, «Imprimir»)");
  await p.pdf({ path: `${DIR}/reporte.pdf`, format: "A4", printBackground: true });
  const { statSync } = await import("node:fs");
  ck(statSync(`${DIR}/reporte.pdf`).size > 5000, `se genera el PDF A4 (${statSync(`${DIR}/reporte.pdf`).size} bytes)`);
  await p.screenshot({ path: `${DIR}/shots/d-impresion.png`, fullPage: true });
  await ctx.close();
}

// ===== video con checkpoint. YouTube y Vimeo no reproducen en un Chromium automatizado (anti-bot / DRM), así que se simula el
// evento de tiempo del reproductor: se prueba la lógica de React (tiempo → pausa → pregunta → fallo → volver → acierto).
{
  const { ctx, p } = await abrir("hijo", 820, 1180);
  await p.goto(`${BASE}${H}`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Empezar", exact: true }).first().click(); await p.waitForTimeout(3000);
  ck((await p.locator("iframe").count()) > 0, "el visor carga el reproductor del video (react-player)");
  const tiempo = async (t: number) => p.evaluate((t) => {
    const el = document.querySelector("youtube-video, vimeo-video, video") as (HTMLElement & { currentTime: number }) | null; if (!el) return false;
    const w = el as unknown as { __t?: number };
    if (w.__t === undefined) { w.__t = 0; Object.defineProperty(el, "currentTime", { configurable: true, get: () => w.__t as number, set: (v) => { w.__t = v; } }); }
    w.__t = t; el.dispatchEvent(new Event("timeupdate")); return true;
  }, t);
  const overlay = p.getByRole("dialog", { name: "Pregunta del video" });
  ck(await tiempo(2), "simulado: el video va por el segundo 2");
  await p.waitForTimeout(500);
  ck(!(await overlay.isVisible().catch(() => false)), "a los 2 s todavía no hay pregunta");
  await tiempo(4); await p.waitForTimeout(800);
  ck(await overlay.isVisible().catch(() => false), "a los 4 s (≥ 3) el video se pausa y aparece la pregunta del checkpoint");
  await p.screenshot({ path: `${DIR}/shots/d-checkpoint.png` });
  await overlay.getByRole("button", { name: "No" }).click(); await p.waitForTimeout(1500);
  ck(await overlay.getByText("Volver 30 s").isVisible().catch(() => false), "responder mal muestra la explicación y «Volver 30 s»");
  await overlay.getByRole("button", { name: /Volver 30 s/ }).click(); await p.waitForTimeout(800);
  ck(!(await overlay.isVisible().catch(() => false)), "«Volver 30 s» cierra la pregunta");
  await tiempo(5); await p.waitForTimeout(800);
  ck(await overlay.isVisible().catch(() => false), "la pregunta no acertada vuelve a aparecer");
  await overlay.getByRole("button", { name: "Sí" }).click(); await p.waitForTimeout(1500);
  ck(await overlay.getByRole("button", { name: "Continuar" }).isVisible().catch(() => false), "responder bien muestra «Continuar»");
  await overlay.getByRole("button", { name: "Continuar" }).click(); await p.waitForTimeout(600);
  await tiempo(8); await p.waitForTimeout(800);
  ck(!(await overlay.isVisible().catch(() => false)), "acertada la pregunta ya no vuelve a aparecer");
  await ctx.close();
}
await nav.close();
const mal = res.filter((x) => !x.ok);
console.log(`\nFASE D: ${res.length - mal.length}/${res.length} OK, ${mal.length} FALLA`);
await prisma.$disconnect();
