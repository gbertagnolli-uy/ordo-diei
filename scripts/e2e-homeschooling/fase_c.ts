import { chromium } from "playwright-core";
import { api, BASE, CHROMIUM, DIR, guardar, leer, prisma, SUFIJO } from "./lib.ts";

const e = leer(); const H = "/dashboard/homeschooling";
const res: { ok: boolean; t: string }[] = [];
const ck = (ok: boolean, t: string) => { res.push({ ok, t }); console.log((ok ? "OK    " : "FALLA ") + t); };
const cp = e.cookies.padre, ch = e.cookies.hijo;
const calma = async (p: { waitForLoadState(s: string): Promise<void>; waitForTimeout(n: number): Promise<void> }) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(500); };
// Comprueba contra la base reintentando: la acción de la pantalla puede tardar unos segundos (base remota)
const irA = async (p: { waitForURL(u: RegExp, o: object): Promise<void> }, re: RegExp) => { await p.waitForURL(re, { timeout: 20000 }).catch(() => {}); };
const ckp = async (t: string, fn: () => Promise<boolean>) => { let ok = false; for (let i = 0; i < 20 && !ok; i++) { ok = await fn().catch(() => false); if (!ok) await new Promise((r) => setTimeout(r, 700)); } ck(ok, t); };

// ---- datos extra por API
const mk = async (nombre: string) => (await api(cp, "/api/homeschooling/materias", { body: { nombre: `${nombre} ${SUFIJO}`, icono: "Calculator", color: "primary" } })).json.id as number;
const curso = async (materiaId: number, titulo: string) => (await api(cp, "/api/homeschooling/cursos", { body: { materiaId, titulo: `${titulo} ${SUFIJO}`, tipo: "curso_videos", unidadTipo: "leccion", minutosPorUnidad: 20 } })).json.id as number;
const lec = async (recursoId: number, titulo: string, url: string | null = null) => (await api(cp, "/api/homeschooling/lecciones", { body: { recursoId, titulo, url } })).json.id as number;
const mat2 = await mk("Mate"); const cur2 = await curso(mat2, "Fracciones"); const l2a = await lec(cur2, "Mitades", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"); const l2b = await lec(cur2, "Tercios");
await api(cp, "/api/homeschooling/planes", { body: { recursoId: cur2, alumnoId: e.hijoId, inicio: e.hoy, fin: e.hoy, diasSemana: [1, 2, 3, 4, 5, 6, 7] } });
const mat3 = await mk("Orden"); const curX = await curso(mat3, "Curso X"); const curY = await curso(mat3, "Curso Y");
for (const t of ["Uno", "Dos", "Tres"]) await lec(curX, t);
for (const t of ["Alfa", "Beta"]) await lec(curY, t);
const r3 = await api(cp, "/api/homeschooling/planes", { body: { recursoId: curX, alumnoId: e.hermanoId, inicio: e.hoy, fin: `${e.hoy.slice(0, 8)}28`, diasSemana: [1, 2, 3, 4, 5] } });
const mat4 = await mk("Archivable");
Object.assign(e, { mat2, cur2, l2a, l2b, mat3, curX, curY, mat4, planX: r3.json?.plan?.id });
guardar(e);

const nav = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox"] });
const abrir = async (quien: "padre" | "hijo", ancho = 1440, alto = 900) => {
  const ctx = await nav.newContext({ viewport: { width: ancho, height: alto }, locale: "es-UY", timezoneId: "America/Montevideo" });
  await ctx.addCookies([{ name: "session", value: e.cookies[quien], url: BASE }]);
  const p = await ctx.newPage(); const errs: string[] = [];
  p.on("pageerror", (x) => errs.push(String(x).slice(0, 150)));
  p.on("console", (m) => { if (m.type() === "error" && !/compute-pressure|Permissions policy/.test(m.text())) errs.push(m.text().slice(0, 150)); });
  return { ctx, p, errs };
};
const url = (p: { url(): string }) => new URL(p.url()).pathname + new URL(p.url()).search;
const shot = (p: { screenshot(o: object): Promise<unknown> }, n: string) => p.screenshot({ path: `${DIR}/shots/c-${n}.png`, fullPage: false });

// ================= PADRE: navegación
{
  const { ctx, p, errs } = await abrir("padre");
  await p.goto(`${BASE}${H}/materias/${e.materiaId}`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Uruguay/ }).first().click(); await calma(p);
  ck(url(p).includes(`module=${e.recursoId}`), `clic en un curso → ${url(p)}`);
  ck(await p.getByRole("navigation", { name: "Migas de pan" }).getByText(/Uruguay/).isVisible(), "migas: Estudio › Materia › Curso");
  await shot(p, "curso");
  await p.getByRole("button", { name: /^Volver a Historia/ }).click(); await calma(p);
  ck(!url(p).includes("module="), `«← Materia» vuelve a la materia (${url(p)})`);
  await p.getByRole("button", { name: /Uruguay/ }).first().click(); await calma(p);
  await p.getByRole("button", { name: /1\. Los charrúas/ }).click(); await calma(p);
  ck(url(p).includes("lesson="), `clic en una lección → ${url(p)}`);
  await shot(p, "leccion");
  await p.goBack(); await calma(p);
  ck(url(p).includes("module=") && !url(p).includes("lesson="), `el botón «atrás» del navegador vuelve al curso (${url(p)})`);
  await p.goForward(); await calma(p);
  await p.getByRole("button", { name: /Uruguay __test/ }).first().click(); await calma(p);
  ck(url(p).includes("module=") && !url(p).includes("lesson="), `«← Curso» vuelve al curso desde la lección (${url(p)})`);
  await p.getByRole("navigation", { name: "Migas de pan" }).getByRole("button", { name: /Historia/ }).click(); await calma(p);
  ck(!url(p).includes("module="), "la miga «Materia» vuelve a la materia");
  await p.getByRole("navigation", { name: "Migas de pan" }).getByRole("link", { name: "Estudio" }).click(); await irA(p, /homeschooling$/); await calma(p);
  ck(url(p) === H, `la miga «Estudio» lleva al panel (${url(p)})`);
  for (const [tab, ruta] of [["Plan", "/plan"], ["Revisión", "/revision"], ["Portafolio", "/portafolio"], ["Actividades", "/horas"], ["Reportes", "/reportes"], ["Apoyos", "/neurodivergencia"], ["Días sin clase", "/dias-sin-clase"], ["Panel", ""]] as const) {
    await p.getByRole("navigation", { name: "Secciones de Estudio" }).getByRole("link", { name: new RegExp(tab) }).click(); await irA(p, new RegExp(`homeschooling${ruta}(\\?|$)`)); await calma(p);
    ck(url(p).startsWith(H + ruta), `pestaña «${tab}» → ${url(p)}`);
  }
  // acceso directo a un curso desde el panel
  await p.getByRole("link", { name: /Uruguay/ }).first().click(); await irA(p, /module=/); await calma(p);
  ck(url(p).includes(`/materias/${e.materiaId}?module=${e.recursoId}`), "el curso del panel abre directo su pantalla");
  ck(errs.length === 0, `sin errores de consola (${errs.length}) ${errs[0] ?? ""}`);
  await ctx.close();
}

// ================= PADRE: reordenar, archivar, planes
{
  const { ctx, p, errs } = await abrir("padre");
  await p.goto(`${BASE}${H}/materias/${mat3}?module=${curX}`, { waitUntil: "networkidle" });
  const titulos = async () => (await p.locator("button", { hasText: /^\d+\. / }).allTextContents()).map((t) => t.replace(/\s+/g, " ").trim().slice(0, 12));
  const antes = await titulos();
  await p.getByRole("button", { name: /Bajar «Uno»/ }).click(); await p.waitForTimeout(150);
  const despues = await titulos();
  ck(antes[0].includes("Uno") && despues[0].includes("Dos") && despues[1].includes("Uno"), `lecciones: «Uno» bajó al instante en la pantalla (${antes[0]} | ${despues[0]}, ${despues[1]})`);
  await ckp("orden de lecciones guardado en la base: 1:Dos, 2:Uno, 3:Tres", async () => (await prisma.leccionCurso.findMany({ where: { recursoId: curX }, orderBy: { orden: "asc" } })).map((l) => `${l.orden}:${l.titulo}`).join() === "1:Dos,2:Uno,3:Tres");
  await p.goto(`${BASE}${H}/materias/${mat3}`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Ordenar/ }).click();
  await p.getByRole("button", { name: /Mover «Curso X.*después/ }).click(); await calma(p);
  await ckp("cursos reordenados en la base: Y, X", async () => (await prisma.recursoCurso.findMany({ where: { materiaId: mat3 }, orderBy: { orden: "asc" } })).map((c) => c.titulo.split(" ")[1]).join() === "Y,X");
  // planes: pausar, reanudar, cambiar fin, quitar con días cumplidos…
  await p.goto(`${BASE}${H}/materias/${mat3}?module=${curX}`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Opciones del plan de hermano/ }).click(); await p.getByRole("menuitem", { name: "Pausar" }).click(); await calma(p);
  await ckp("pausar el plan desde el menú", async () => (await prisma.planCurso.findUnique({ where: { id: e.planX } }))?.estado === "pausado");
  await p.getByRole("button", { name: /Opciones del plan de hermano/ }).click(); await p.getByRole("menuitem", { name: "Reanudar" }).click(); await calma(p);
  await ckp("reanudar el plan", async () => (await prisma.planCurso.findUnique({ where: { id: e.planX } }))?.estado === "activo");
  await p.getByRole("button", { name: /Opciones del plan de hermano/ }).click(); await p.getByRole("menuitem", { name: /Cambiar fecha de fin/ }).click();
  await p.getByLabel("Termina el").fill(`${e.hoy.slice(0, 8)}27`); await p.getByRole("button", { name: "Guardar" }).click(); await calma(p);
  await ckp("cambiar la fecha de fin del plan", async () => (await prisma.planCurso.findUnique({ where: { id: e.planX } }))?.fin.toISOString().slice(0, 10) === `${e.hoy.slice(0, 8)}27`);
  await shot(p, "plan-menu");
  await p.getByRole("button", { name: /Opciones del plan de hermano/ }).click(); await p.getByRole("menuitem", { name: /Quitar el plan/ }).click();
  await p.getByRole("dialog").getByRole("button", { name: "Quitar" }).click(); await calma(p);
  await ckp("quitar un plan sin días cumplidos", async () => (await prisma.planCurso.count({ where: { id: e.planX } })) === 0);
  // archivar / restaurar
  await p.goto(`${BASE}${H}/materias/${mat4}`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Archivar la materia" }).click(); await p.getByRole("dialog").getByRole("button", { name: "Archivar" }).click(); await irA(p, /homeschooling$/); await calma(p);
  ck(url(p) === H, `archivar vuelve al panel (${url(p)})`);
  ck(await p.getByRole("region", { name: "Materias archivadas" }).getByText(/Archivable/).isVisible(), "aparece en «Archivadas»");
  await p.getByRole("region", { name: "Materias archivadas" }).getByRole("button", { name: /Restaurar/ }).first().click(); await calma(p);
  await ckp("restaurar la materia", async () => (await prisma.materia.findUnique({ where: { id: mat4 } }))?.activa === true);
  // editar materia
  await p.goto(`${BASE}${H}/materias/${mat4}`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Editar la materia" }).click(); await p.getByLabel("Nombre").fill(`Archivable editada ${SUFIJO}`); await p.getByRole("button", { name: /Guardar cambios/ }).click(); await calma(p);
  await ckp("editar el nombre de la materia", async () => (await prisma.materia.findUnique({ where: { id: mat4 } }))?.nombre.startsWith("Archivable editada") === true);
  ck(errs.length === 0, `sin errores de consola (${errs.length}) ${errs[0] ?? ""}`);
  await ctx.close();
}

// ================= HIJO: Primero/Después, visor, reloj, foto, historia, modo calmo
{
  const { ctx, p, errs } = await abrir("hijo", 820, 1180);
  await p.goto(`${BASE}${H}`, { waitUntil: "networkidle" });
  ck((await p.locator("html").getAttribute("data-relajado")) === "1", "modo relajado: <html data-relajado> puesto");
  ck(await p.getByText("PRIMERO").isVisible() && await p.getByText("15 min de Lego").isVisible(), "Primero/Después con la recompensa del padre");
  ck(await p.getByText("Vamos al médico").first().isVisible(), "la historia social del día aparece arriba");
  await shot(p, "hijo-hoy");
  // reloj visual
  await p.getByRole("button", { name: /Empezar el reloj/ }).click(); await p.waitForTimeout(2200);
  const t1 = await p.getByRole("timer").first().getAttribute("aria-label");
  ck(/Quedan (39:5|40:0|39:4)/.test(t1 ?? ""), `el reloj visual corre (${t1})`);
  await p.getByRole("button", { name: /Pausar/ }).click();
  // historia
  await p.getByRole("button", { name: /Vamos al médico/ }).first().click(); await calma(p);
  ck(await p.getByText("Paso 1 de 3").isVisible(), "visor de la historia: paso 1 de 3");
  await shot(p, "hijo-historia");
  await p.getByRole("button", { name: /Siguiente/ }).click(); await p.getByRole("button", { name: /Siguiente/ }).click(); await p.getByRole("button", { name: /Listo/ }).click(); await calma(p);
  await ckp("la historia queda vista y deja de mostrarse", async () => (await prisma.historiaSocial.findFirst({ where: { alumnoId: e.hijoId } }))?.vistaEn != null);
  // foto
  await p.getByRole("button", { name: /Sacar una foto de mi trabajo/ }).first().click(); await calma(p);
  ck(await p.getByText("Mostrar mi trabajo").isVisible(), "la cámara abre «Mostrar mi trabajo»");
  await shot(p, "hijo-foto"); await p.keyboard.press("Escape"); await calma(p);
  // visor + completar el día
  await p.getByRole("button", { name: "Empezar", exact: true }).click(); await calma(p);
  ck(await p.getByRole("heading", { name: "1. Mitades" }).isVisible(), "el visor abre la lección 1");
  ck(await p.locator("iframe, video").first().isVisible().catch(() => false), "hay un reproductor de video (react-player)");
  await shot(p, "hijo-visor");
  await p.getByRole("button", { name: /Terminé/ }).click(); await p.getByRole("heading", { name: "2. Tercios" }).waitFor({ timeout: 20000 }).catch(() => {}); await calma(p);
  ck(await p.getByRole("heading", { name: "2. Tercios" }).isVisible(), "al terminar la 1 pasa a la lección 2");
  await p.getByRole("button", { name: /Terminé/ }).click(); await p.getByText("¡Buen trabajo!").first().waitFor({ timeout: 25000 }).catch(() => {}); await calma(p);
  ck(await p.getByText("¡Buen trabajo!").first().isVisible().catch(() => false), "al terminar la última aparece el mensaje de logro (TASK_SUCCESS)");
  ck(await p.getByText("✓", { exact: true }).isVisible().catch(() => false), "modo relajado: check estático en lugar de confeti");
  await shot(p, "hijo-exito");
  await ckp("la Tarea de Fracciones quedó esperando la aprobación", async () => (await prisma.tarea.findFirst({ where: { asignadoId: e.hijoId, titulo: { contains: "Fracciones" } } }))?.estado === "Esperando_Aprobacion");
  // modo calmo
  await p.keyboard.press("Escape"); await calma(p);
  await p.getByRole("switch", { name: "Modo calmo" }).click(); await calma(p);
  ck((await p.locator("html").getAttribute("data-relajado")) === null, "apagar el modo calmo quita el atributo");
  ck(errs.length === 0, `sin errores de consola (${errs.length}) ${errs[0] ?? ""}`);
  await ctx.close();
}

// ================= PADRE: cronómetro de actividades
{
  const { ctx, p, errs } = await abrir("padre");
  await p.goto(`${BASE}${H}/horas`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Cronometrar/ }).click(); await calma(p);
  ck(await p.getByRole("timer", { name: "Cronómetro de actividad" }).isVisible(), "el cronómetro corre");
  await p.reload({ waitUntil: "networkidle" });
  ck(await p.getByRole("timer", { name: "Cronómetro de actividad" }).isVisible(), "sigue corriendo después de recargar la pantalla");
  await p.getByRole("button", { name: /Parar y registrar/ }).click(); await calma(p);
  ck(await p.getByRole("heading", { name: "Nueva actividad" }).isVisible(), "al parar abre «Nueva actividad» con las horas cargadas");
  ck((await p.getByLabel("Desde").inputValue()).length > 0 && (await p.getByLabel("Hasta").inputValue()).length > 0, "inicio y fin vienen completos");
  await shot(p, "cronometro");
  ck(errs.length === 0, `sin errores de consola (${errs.length}) ${errs[0] ?? ""}`);
  await ctx.close();
}
await nav.close();
const mal = res.filter((x) => !x.ok);
console.log(`\nFASE C: ${res.length - mal.length}/${res.length} OK, ${mal.length} FALLA`);
await prisma.$disconnect();
