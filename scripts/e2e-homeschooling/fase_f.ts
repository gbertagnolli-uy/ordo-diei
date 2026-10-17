// Fase F: la cámara en un teléfono emulado (Pixel 7: pantalla táctil, UA móvil). Se comprueba el atributo capture="environment" en
// los dos caminos (el de react-dropzone y el botón «Cámara» de respaldo), que el botón abre el selector de archivos y que una foto
// grande pasa por la compresión, se sube, queda como evidencia y se sirve. (La cámara física del aparato no se puede automatizar.)
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices } from "playwright-core";
import { BASE, CHROMIUM, DIR, leer, prisma } from "./lib.ts";

const e = leer(); const H = "/dashboard/homeschooling";
const res: { ok: boolean; t: string }[] = [];
const ck = (ok: boolean, t: string) => { res.push({ ok, t }); console.log((ok ? "OK    " : "FALLA ") + t); };
const foto = join(DIR, "foto.jpg");
if (!existsSync(foto)) spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc=size=2400x1800", "-frames:v", "1", "-q:v", "2", foto]);
const bytesFoto = (await import("node:fs")).statSync(foto).size;

const nav = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox"] });
const ctx = await nav.newContext({ ...devices["Pixel 7"], locale: "es-UY", timezoneId: "America/Montevideo" });
await ctx.addCookies([{ name: "session", value: e.cookies.hijo, url: BASE }]);
const p = await ctx.newPage(); const errs: string[] = [];
p.on("pageerror", (x) => errs.push(String(x).slice(0, 150)));
await p.goto(`${BASE}${H}/portafolio`, { waitUntil: "networkidle" });
ck(await p.evaluate(() => "ontouchstart" in window || navigator.maxTouchPoints > 0), "emulación móvil táctil (Pixel 7)");
await p.getByRole("button", { name: /Mostrar mi trabajo/ }).click();
await p.getByText("Mostrar mi trabajo").first().waitFor({ timeout: 8000 });

const capturas = await p.locator('input[type="file"][capture="environment"]').count();
ck(capturas >= 2, `hay ${capturas} entradas de archivo con capture="environment" (la de react-dropzone y la del botón «Cámara»)`);
ck((await p.locator('input[type="file"][accept*="image"]').count()) >= 2, "ambas aceptan imágenes (accept=image/*)");

// 1) el botón «Cámara» abre el selector de archivos (en el teléfono, la cámara)
const [selector] = await Promise.all([p.waitForEvent("filechooser", { timeout: 8000 }), p.getByRole("button", { name: "Cámara" }).click()]);
ck(!!selector, "«Cámara» abre el selector de archivos del sistema");
await selector.setFiles(foto);
await p.getByRole("dialog").locator("img[src^='/api/archivos/']").first().waitFor({ timeout: 25000 }).catch(() => {});
const miniaturas = await p.getByRole("dialog").locator("img[src^='/api/archivos/']").count();
ck(miniaturas === 1, `la foto (${(bytesFoto / 1e6).toFixed(1)} MB, 2400×1800) se comprimió, se subió y aparece como miniatura (${miniaturas})`);

// 2) el camino de react-dropzone: tocar la zona abre el selector
const [sel2] = await Promise.all([p.waitForEvent("filechooser", { timeout: 8000 }), p.getByText(/Tocá para sacar o elegir una foto/).click()]);
await sel2.setFiles(foto);
await p.waitForFunction(() => (document.querySelector('[role=dialog]')?.querySelectorAll("img[src^='/api/archivos/']").length ?? 0) >= 2, null, { timeout: 25000 }).catch(() => {});
ck((await p.getByRole("dialog").locator("img[src^='/api/archivos/']").count()) === 2, "la zona de arrastrar/tocar también sube la foto (2 miniaturas)");

await p.getByLabel(/Título/).fill("Foto desde el teléfono");
await p.getByRole("button", { name: "Enviar" }).click();
await p.getByText("¡Enviado!").first().waitFor({ timeout: 20000 }).catch(() => {});
ck(await p.getByText("¡Enviado!").first().isVisible().catch(() => false), "«Enviar» confirma con «¡Enviado!»");

const ev = await prisma.evidenciaAprendizaje.findFirst({ where: { alumnoId: e.hijoId, titulo: "Foto desde el teléfono" }, orderBy: { id: "desc" }, include: { imagenes: true } });
ck(ev?.estado === "pendiente" && ev.imagenes.length === 2, `la evidencia quedó pendiente con ${ev?.imagenes.length} fotos`);
const clave = ev?.imagenes[0].archivoUrl.split("/").pop() ?? "";
const arch = await prisma.archivo.findUnique({ where: { clave }, select: { tipo: true, bytes: true, ancho: true, alto: true } });
ck(!!arch && arch.bytes < bytesFoto / 3 && arch.tipo === "image/webp", `se guardó comprimida: ${arch ? `${(arch.bytes / 1024).toFixed(0)} KB ${arch.tipo} ${arch.ancho}×${arch.alto}` : "sin archivo"} (original ${(bytesFoto / 1024).toFixed(0)} KB)`);
const serv = await fetch(`${BASE}${ev?.imagenes[0].archivoUrl}`);
ck(serv.status === 200 && (serv.headers.get("content-type") ?? "").startsWith("image/"), `la foto se sirve (${serv.status} ${serv.headers.get("content-type")})`);
const desborde = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
ck(!desborde, "la pantalla del teléfono no se desborda");
ck(errs.length === 0, `sin excepciones de la página (${errs.length}) ${errs[0] ?? ""}`);
await p.screenshot({ path: `${DIR}/shots/f-camara-movil.png` });
await ctx.close(); await nav.close();
const mal = res.filter((x) => !x.ok);
console.log(`\nFASE F: ${res.length - mal.length}/${res.length} OK, ${mal.length} FALLA`);
await prisma.$disconnect();
