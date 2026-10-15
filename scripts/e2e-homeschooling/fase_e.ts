// Fase E: reproducción REAL de un video (archivo .webm generado con ffmpeg y servido localmente con soporte de rangos) y el
// checkpoint con el `timeupdate` verdadero del navegador: pausa a los 3 s, fallo → «Volver 30 s», acierto → «Continuar».
// (YouTube y Vimeo no reproducen en un Chromium automatizado; el archivo directo sí.) Requiere haber corrido fase_a.
import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { api, BASE, CHROMIUM, DIR, guardar, leer, prisma, SUFIJO } from "./lib.ts";

const e = leer(); const H = "/dashboard/homeschooling"; const cp = e.cookies.padre;
const res: { ok: boolean; t: string }[] = [];
const ck = (ok: boolean, t: string) => { res.push({ ok, t }); console.log((ok ? "OK    " : "FALLA ") + t); };

const archivo = join(DIR, "clase.webm");
if (!existsSync(archivo)) {
  const r = spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc=size=320x180:rate=10", "-t", "14", "-c:v", "libvpx", "-b:v", "200k", "-g", "10", archivo]);
  if (r.status !== 0) { console.log("No se pudo generar el video con ffmpeg:", String(r.stderr).slice(-200)); process.exit(1); }
}
// Servidor con Range (el navegador lo necesita para buscar en el video: «Volver 30 s»)
const tam = statSync(archivo).size;
const servidor = createServer((req, res2) => {
  const rango = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
  const h = { "Content-Type": "video/webm", "Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*" };
  if (rango) {
    const ini = rango[1] ? Number(rango[1]) : 0, fin = rango[2] ? Number(rango[2]) : tam - 1;
    res2.writeHead(206, { ...h, "Content-Range": `bytes ${ini}-${fin}/${tam}`, "Content-Length": fin - ini + 1 }); createReadStream(archivo, { start: ini, end: fin }).pipe(res2);
  } else { res2.writeHead(200, { ...h, "Content-Length": tam }); createReadStream(archivo).pipe(res2); }
}).listen(3200);
const url = "http://localhost:3200/clase.webm";

// ---- datos: curso de videos con una lección-archivo, un checkpoint a los 3 s y un plan para hoy
const mat = (await api(cp, "/api/homeschooling/materias", { body: { nombre: `Video real ${SUFIJO}`, icono: "Brain", color: "primary" } })).json.id as number;
const cur = (await api(cp, "/api/homeschooling/cursos", { body: { materiaId: mat, titulo: `Archivo ${SUFIJO}`, tipo: "curso_videos", unidadTipo: "leccion", minutosPorUnidad: 10 } })).json.id as number;
const lec = (await api(cp, "/api/homeschooling/lecciones", { body: { recursoId: cur, titulo: "Clase en archivo", url } })).json.id as number;
const guardada = await prisma.leccionCurso.findUnique({ where: { id: lec } });
ck(guardada?.url === url && guardada.videoPlataforma === null, "la lección guarda el enlace al archivo (sin plataforma)");
await api(cp, `/api/homeschooling/lecciones/${lec}/preguntas`, { method: "PUT", body: { preguntas: [{ enunciado: "¿Ves el contador avanzar?", opciones: ["Sí", "No"], correcta: 0, explicacion: "Seguí mirando", segundoVideo: 3 }] } });
await api(cp, "/api/homeschooling/planes", { body: { recursoId: cur, alumnoId: e.hijoId, inicio: e.hoy, fin: e.hoy, diasSemana: [1, 2, 3, 4, 5, 6, 7] } });
guardar({ ...e, matVideo: mat, curVideo: cur, lecVideo: lec });

const nav = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
// ---- el padre ve la lección con su reproductor
{
  const ctx = await nav.newContext({ viewport: { width: 1200, height: 900 } }); await ctx.addCookies([{ name: "session", value: cp, url: BASE }]);
  const p = await ctx.newPage(); await p.goto(`${BASE}${H}/materias/${mat}?module=${cur}&lesson=${lec}`, { waitUntil: "networkidle" });
  ck(await p.locator("video").first().isVisible(), "la vista previa del padre muestra el video del archivo");
  await ctx.close();
}
// ---- el hijo lo mira con el checkpoint
const ctx = await nav.newContext({ viewport: { width: 820, height: 1180 } }); await ctx.addCookies([{ name: "session", value: e.cookies.hijo, url: BASE }]);
const p = await ctx.newPage(); const errs: string[] = [];
p.on("pageerror", (x) => errs.push(String(x).slice(0, 150)));
await p.goto(`${BASE}${H}`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Empezar", exact: true }).first().click();
const video = p.locator("video").first();
await video.waitFor({ timeout: 15000 });
ck(await video.isVisible(), "el visor muestra un <video> (react-player sobre el archivo)");
const estado = () => video.evaluate((v: HTMLVideoElement) => ({ t: v.currentTime, pausado: v.paused, dur: v.duration, listo: v.readyState }));
await video.evaluate((v: HTMLVideoElement) => { v.muted = true; return v.play(); }).catch(() => {});
await p.waitForTimeout(1200);
let s = await estado();
ck(s.listo >= 2 && s.dur > 10, `el navegador cargó el video real (duración ${s.dur.toFixed(1)} s)`);
ck(s.t > 0.3 && !s.pausado, `el video reproduce de verdad (t=${s.t.toFixed(1)} s)`);
const overlay = p.getByRole("dialog", { name: "Pregunta del video" });
await overlay.waitFor({ timeout: 15000 }).catch(() => {});
s = await estado();
ck(await overlay.isVisible(), "al llegar a los 3 s aparece la pregunta del checkpoint");
ck(s.pausado && s.t >= 2.9 && s.t < 4.5, `el video quedó pausado en el segundo ${s.t.toFixed(1)}`);
await p.waitForTimeout(1500);
ck((await estado()).t - s.t < 0.3, "mientras la pregunta está abierta el video no avanza");
await p.screenshot({ path: `${DIR}/shots/e-checkpoint-real.png` });
await overlay.getByRole("button", { name: "No" }).click(); await p.waitForTimeout(1500);
ck(await overlay.getByText("Volver 30 s").isVisible(), "responder mal muestra la explicación y «Volver 30 s»");
await overlay.getByRole("button", { name: /Volver 30 s/ }).click(); await p.waitForTimeout(700);
s = await estado();
ck(!(await overlay.isVisible()) && s.t < 2.5, `«Volver 30 s» cierra la pregunta y vuelve al comienzo (t=${s.t.toFixed(1)} s)`);
await video.evaluate((v: HTMLVideoElement) => v.play()).catch(() => {});
await overlay.waitFor({ timeout: 15000 }).catch(() => {});
ck(await overlay.isVisible(), "al volver a pasar por los 3 s la pregunta reaparece (no estaba acertada)");
await overlay.getByRole("button", { name: "Sí" }).click(); await p.waitForTimeout(1500);
await overlay.getByRole("button", { name: "Continuar" }).click(); await p.waitForTimeout(800);
await video.evaluate((v: HTMLVideoElement) => v.play()).catch(() => {});
await p.waitForTimeout(3500);
s = await estado();
ck(!(await overlay.isVisible()) && s.t > 4, `acertada la pregunta el video sigue (t=${s.t.toFixed(1)} s) y no vuelve a pausarse`);
// terminar la lección
await p.getByRole("button", { name: /Terminé/ }).click();
await p.getByText("¡Buen trabajo!").first().waitFor({ timeout: 25000 }).catch(() => {});
ck(await p.getByText("¡Buen trabajo!").first().isVisible().catch(() => false), "terminar la lección completa la Tarea del día");
ck(errs.length === 0, `sin excepciones de la página (${errs.length}) ${errs[0] ?? ""}`);
await ctx.close(); await nav.close(); servidor.close();
const mal = res.filter((x) => !x.ok);
console.log(`\nFASE E: ${res.length - mal.length}/${res.length} OK, ${mal.length} FALLA`);
await prisma.$disconnect();
