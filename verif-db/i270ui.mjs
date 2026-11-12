// Prueba en navegador de la biblioteca (lane 270, fases 2 y 3). node i270ui.mjs <puerto> <carpeta_capturas>
import { chromium, request } from "playwright";
const [puerto, dir] = process.argv.slice(2);
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const errores = [];
let fallas = 0;
const ok = (cond, msg) => {
  if (!cond) fallas++;
  console.log(cond ? "OK  " : "FALLA", msg);
};
async function entrar(userId, ancho = 1300) {
  const ctx = await b.newContext({ viewport: { width: ancho, height: 900 }, locale: "es-UY" });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && errores.push(`[${userId}] ${m.text().slice(0, 200)}`));
  p.on("pageerror", (e) => errores.push(`[${userId}] pageerror ${e.message.slice(0, 200)}`));
  const r = await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  if (!r.ok()) throw new Error(`login ${userId}: ${r.status()}`);
  return p;
}
const ID = Date.now() % 100000;
const ESTANTE = `Clásicos ${ID}`;

// 1. Papá gestiona: estante + subir el ePub
const papa = await entrar(1);
await papa.goto(`${base}/dashboard/biblioteca/gestionar`, { waitUntil: "networkidle", timeout: 180000 });
ok((await papa.locator("h1").innerText()) === "Gestionar la biblioteca", "el padre entra a Gestionar");
await papa.getByLabel("Nombre del estante nuevo").fill(ESTANTE);
await papa.getByRole("button", { name: "Crear" }).click();
await papa.getByText(ESTANTE).waitFor({ timeout: 15000 });
ok(true, "crea un estante");
await papa.locator('input[type="file"]').setInputFiles(`${process.cwd()}/prueba270.epub`);
await papa.getByText("Subida terminada").waitFor({ timeout: 60000 });
ok((await papa.getByRole("dialog").innerText()).includes("Agregado"), "sube el ePub (estado «Agregado»)");
await papa.getByRole("button", { name: "Cerrar" }).first().click();
await papa.getByText("prueba270", { exact: false }).first().waitFor({ timeout: 15000 });
ok(true, "el libro aparece en la lista");

// 2. Editar: título, autor y estante
await papa.getByRole("button", { name: /^Editar prueba270/ }).click();
await papa.getByLabel("Título").fill(`El libro de prueba ${ID}`);
await papa.getByLabel("Autor").fill("Juan Zorrilla");
await papa.getByRole("dialog").getByText(ESTANTE).click();
await papa.getByRole("button", { name: "Guardar" }).click();
await papa.getByText(`El libro de prueba ${ID}`).waitFor({ timeout: 15000 });
ok((await papa.locator("body").innerText()).includes(`Juan Zorrilla · ${ESTANTE}`), "edita título, autor y estante");
await papa.screenshot({ path: `${dir}/270-gestionar.png`, fullPage: true });

// 3. Juan: biblioteca sin «Gestionar»; /gestionar lo devuelve
const juan = await entrar(3);
await juan.goto(`${base}/dashboard/biblioteca`, { waitUntil: "networkidle" });
ok(await juan.getByRole("link", { name: `El libro de prueba ${ID}`, exact: true }).isVisible(), "Juan ve el libro");
ok((await juan.getByRole("link", { name: "Gestionar" }).count()) === 0, "Juan no ve «Gestionar»");
await juan.goto(`${base}/dashboard/biblioteca/gestionar`, { waitUntil: "networkidle" });
ok(new URL(juan.url()).pathname === "/dashboard/biblioteca", "Juan en /gestionar vuelve a la biblioteca");
await juan.getByLabel("Buscar en la biblioteca").fill("zorrilla");
ok(await juan.getByRole("link", { name: `El libro de prueba ${ID}`, exact: true }).isVisible(), "busca por autor");
await juan.getByLabel("Buscar en la biblioteca").fill("no existe nada así");
ok(await juan.getByText("Ningún libro coincide con la búsqueda.").isVisible(), "búsqueda sin resultados");
await juan.getByRole("button", { name: "Borrar" }).click();
await juan.getByRole("radio", { name: ESTANTE }).click();
ok(await juan.getByRole("link", { name: `El libro de prueba ${ID}`, exact: true }).isVisible(), "filtra por estante");

// 4. Detalle → Leer → avanzar → la posición se guarda
await juan.getByRole("link", { name: `El libro de prueba ${ID}` }).first().click();
await juan.waitForURL(/\/biblioteca\/libro\/\d+/);
const libroId = Number(juan.url().match(/libro\/(\d+)/)[1]);
ok((await juan.locator("body").innerText()).includes("Sin empezar"), "el detalle dice «Sin empezar»");
await juan.getByRole("link", { name: /Leer/ }).click();
await juan.waitForURL(/\/biblioteca\/leer\//);
await juan.getByRole("button", { name: "Página siguiente" }).and(juan.locator(":not([disabled])")).waitFor({ timeout: 60000 });
for (let i = 0; i < 25; i++) {
  await juan.keyboard.press("ArrowRight");
  await juan.waitForTimeout(150);
}
await juan.waitForTimeout(5000); // espera de 3 s + cálculo de ubicaciones
await juan.screenshot({ path: `${dir}/270-lector.png` });
const api = await request.newContext({ baseURL: base, storageState: await juan.context().storageState() });
let det = (await (await api.get(`/api/biblioteca/libros/${libroId}`)).json()).libro;
ok(det.estado === "leyendo" && det.porcentaje > 0 && !!det.posicion.cfi, `queda «leyendo» con ${det.porcentaje} % y CFI guardado`);

// 5. Reabrir: vuelve al mismo lugar (ya no está en el capítulo 1)
await juan.goto(`${base}/dashboard/biblioteca/leer/${libroId}`, { waitUntil: "networkidle" });
await juan.waitForTimeout(4000);
const textoLibro = (await Promise.all(juan.frames().map((f) => f.locator("body").innerText().catch(() => "")))).join(" ");
ok(textoLibro.includes("Capítulo") && !/Capítulo 1\b/.test(textoLibro), `reabre donde lo dejó (${(textoLibro.match(/Capítulo \d/g) ?? []).join(",")})`);
// Ana no ve la posición de Juan
const ana = await request.newContext({ baseURL: base });
await ana.post("/api/auth/login", { data: { userId: 4, pinSecreto: "1234" } });
ok((await (await ana.get(`/api/biblioteca/libros/${libroId}`)).json()).libro.estado === "sin_empezar", "Ana sigue «sin empezar»");

// 6. Seguir leyendo + marcar leído
await juan.goto(`${base}/dashboard/biblioteca`, { waitUntil: "networkidle" });
ok(await juan.getByRole("heading", { name: "Seguir leyendo" }).isVisible(), "aparece «Seguir leyendo»");
await juan.goto(`${base}/dashboard/biblioteca/libro/${libroId}`, { waitUntil: "networkidle" });
ok(await juan.getByRole("link", { name: /Seguir/ }).isVisible(), "el botón principal dice «Seguir»");
await juan.getByRole("button", { name: "Marcar como leído" }).click();
await juan.getByRole("button", { name: "Volver a leer" }).waitFor({ timeout: 15000 });
det = (await (await api.get(`/api/biblioteca/libros/${libroId}`)).json()).libro;
ok(det.estado === "leido", "marcar como leído");

// 7. Celular (360 px)
const cel = await entrar(3, 360);
for (const [ruta, nombre] of [["/dashboard/biblioteca", "lista"], [`/dashboard/biblioteca/libro/${libroId}`, "detalle"], [`/dashboard/biblioteca/leer/${libroId}`, "lector"]]) {
  await cel.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
  await cel.waitForTimeout(1500);
  const ancho = await cel.evaluate(() => document.documentElement.scrollWidth);
  ok(ancho <= 360, `360 px sin scroll horizontal: ${nombre} (${ancho})`);
  await cel.screenshot({ path: `${dir}/270-cel-${nombre}.png`, fullPage: true });
}

// 8. Limpieza: el padre borra el libro y el estante
papa.on("dialog", (d) => d.accept());
await papa.goto(`${base}/dashboard/biblioteca/gestionar`, { waitUntil: "networkidle" });
await papa.getByRole("button", { name: `Borrar El libro de prueba ${ID}` }).click();
await papa.getByText(`El libro de prueba ${ID}`).waitFor({ state: "detached", timeout: 15000 });
await papa.getByRole("button", { name: `Borrar ${ESTANTE}` }).click();
await papa.getByText(ESTANTE).waitFor({ state: "detached", timeout: 15000 });
ok(true, "el padre borra el libro y el estante");

console.log("errores de consola:", errores.length ? errores : "ninguno");
console.log(fallas ? `${fallas} FALLAS` : "TODO OK");
await b.close();
