import { chromium } from "playwright-core";
import { BASE, CHROMIUM, DIR, leer } from "./lib.ts";

const e = leer();
const H = "/dashboard/homeschooling";
const VISTAS = { movil: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, escritorio: { width: 1440, height: 900 } } as const;
const PAGINAS: { id: string; quien: "padre" | "hijo"; ruta: string }[] = [
  { id: "panel", quien: "padre", ruta: H },
  { id: "materia", quien: "padre", ruta: `${H}/materias/${e.materiaId}` },
  { id: "curso", quien: "padre", ruta: `${H}/materias/${e.materiaId}?module=${e.recursoId}` },
  { id: "leccion", quien: "padre", ruta: `${H}/materias/${e.materiaId}?module=${e.recursoId}&lesson=${e.lecciones[0]}` },
  { id: "plan", quien: "padre", ruta: `${H}/plan?alumno=${e.hijoId}` },
  { id: "revision", quien: "padre", ruta: `${H}/revision?estado=todas` },
  { id: "portafolio", quien: "padre", ruta: `${H}/portafolio` },
  { id: "horas", quien: "padre", ruta: `${H}/horas` },
  { id: "reportes", quien: "padre", ruta: `${H}/reportes?alumno=${e.hijoId}&tipo=mes` },
  { id: "apoyos", quien: "padre", ruta: `${H}/neurodivergencia` },
  { id: "sinclase", quien: "padre", ruta: `${H}/dias-sin-clase` },
  { id: "hoy", quien: "hijo", ruta: H },
  { id: "hijo-portafolio", quien: "hijo", ruta: `${H}/portafolio` },
  { id: "hijo-horas", quien: "hijo", ruta: `${H}/horas` },
  { id: "hijo-reportes", quien: "hijo", ruta: `${H}/reportes?tipo=mes` },
];

const navegador = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox"] });
const informe: string[] = [];
let problemas = 0;

for (const [vista, tam] of Object.entries(VISTAS)) {
  for (const quien of ["padre", "hijo"] as const) {
    const ctx = await navegador.newContext({ viewport: tam, locale: "es-UY", timezoneId: "America/Montevideo" });
    await ctx.addCookies([{ name: "session", value: e.cookies[quien], url: BASE }]);
    for (const p of PAGINAS.filter((x) => x.quien === quien)) {
      const pag = await ctx.newPage();
      const errores: string[] = [];
      pag.on("console", (m) => { if (m.type() === "error" && !/compute-pressure|Permissions policy/.test(m.text())) errores.push(`consola: ${m.text().slice(0, 160)}`); });
      pag.on("pageerror", (x) => errores.push(`excepción: ${String(x).slice(0, 160)}`));
      pag.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) errores.push(`HTTP ${r.status()} ${r.url().replace(BASE, "")}`); });
      try {
        await pag.goto(BASE + p.ruta, { waitUntil: "networkidle", timeout: 30000 });
        await pag.waitForTimeout(600);
        const m = await pag.evaluate(() => ({ ancho: document.documentElement.scrollWidth, vista: window.innerWidth, titulo: document.title, h1: document.querySelector("h1")?.textContent ?? "", url: location.pathname + location.search }));
        const desborde = m.ancho > m.vista + 1;
        await pag.screenshot({ path: `${DIR}/shots/${vista}-${p.id}.png`, fullPage: true });
        const mal = errores.length > 0 || desborde || m.url.startsWith("/?") || m.url === "/";
        if (mal) problemas++;
        informe.push(`${mal ? "PROBLEMA" : "ok      "} ${vista.padEnd(10)} ${p.id.padEnd(16)} ${desborde ? `DESBORDE ${m.ancho}>${m.vista} ` : ""}${m.url === "/" ? "REDIRIGIÓ AL LOGIN " : ""}${[...new Set(errores)].slice(0, 3).join(" | ")}`);
      } catch (x) {
        problemas++;
        informe.push(`PROBLEMA ${vista.padEnd(10)} ${p.id.padEnd(16)} ${String(x).slice(0, 140)}`);
      }
      await pag.close();
    }
    await ctx.close();
  }
}
await navegador.close();
console.log(informe.join("\n"));
console.log(`\nFASE B1: ${informe.length - problemas}/${informe.length} páginas sin problemas`);
