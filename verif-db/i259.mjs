// Lane 259 (M5–M8): rutina familiar compartida. node i259.mjs <puerto> <carpeta>
import { chromium } from "playwright";
import pg from "pg";
const [puerto, dir] = process.argv.slice(2);
const base = `http://localhost:${puerto}`;
const db = new pg.Client("postgresql://postgres:local@localhost:55432/ordo");
await db.connect();
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
let fallas = 0;
const ok = (c, m) => { if (!c) fallas++; console.log(c ? "OK  " : "FALLA", m); };
const errores = [];
const CLAVE = "ordo_diei_rutina_config_v1";
async function dispositivo(userId) {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, timezoneId: "America/Montevideo" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errores.push(e.message.slice(0, 160)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errores.push(m.text().slice(0, 160)));
  if (userId) await p.request.post(`${base}/api/auth/login`, { data: { userId, pinSecreto: "1234" } });
  return p;
}
const local = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), CLAVE);

await q(`DELETE FROM "Rutina_Familiar"`);
const anon = await dispositivo(null);
ok((await anon.request.get(`${base}/api/rutina`)).status() === 401, "sin sesión → 401");

const juan = await dispositivo(3);
let r = await (await juan.request.get(`${base}/api/rutina`)).json();
ok(r.guardada === false && Array.isArray(r.etapas) && r.etapas.length > 0, `sin fila: guardada=false y la rutina por defecto (${r.etapas?.length} etapas)`);
const defecto = r;
ok((await juan.request.post(`${base}/api/rutina`, { data: { etapas: r.etapas, semanalConfig: r.semanalConfig } })).status() === 403, "un hijo no puede guardar (403)");

// D3: el hijo abre horarios con la base vacía → NO publica
await juan.goto(`${base}/dashboard/horarios`, { waitUntil: "networkidle", timeout: 180000 });
await juan.waitForTimeout(1500);
ok((await q(`SELECT count(*) n FROM "Rutina_Familiar"`))[0].n === "0", "el hijo no publica su rutina");

// D3: el padre abre horarios con la base vacía → publica la de su dispositivo
const papa = await dispositivo(1);
await papa.goto(`${base}/dashboard/horarios`, { waitUntil: "networkidle", timeout: 180000 });
await papa.waitForTimeout(2000);
let fila = (await q(`SELECT "Version" v, jsonb_array_length("Etapas") n FROM "Rutina_Familiar" WHERE id = 1`))[0];
ok(fila && fila.n === defecto.etapas.length && fila.v === 1, `el padre publica al abrir una sola vez (${fila?.n} etapas, versión ${fila?.v})`);

// El padre cambia la rutina (como lo haría el editor) → se publica
const cambiada = { ...defecto, etapas: [...defecto.etapas] };
cambiada.etapas[0] = { ...cambiada.etapas[0], titulo: "Despertar (lane 259)" };
r = await papa.request.post(`${base}/api/rutina`, { data: { etapas: cambiada.etapas, semanalConfig: cambiada.semanalConfig } });
const rj = await r.json();
ok(r.status() === 200 && rj.version === (fila?.v ?? 0) + 1, `el padre guarda: versión ${rj.version}`);
ok((await papa.request.post(`${base}/api/rutina`, { data: { etapas: "x" } })).status() === 400, "cuerpo inválido → 400");

// Otro dispositivo (Juan) al abrir recibe el cambio en su localStorage
await juan.goto(`${base}/dashboard/horarios`, { waitUntil: "networkidle" });
await juan.waitForTimeout(2000);
const lj = await local(juan);
ok(lj?.etapas?.[0]?.titulo === "Despertar (lane 259)", `el hijo ve el cambio del padre («${lj?.etapas?.[0]?.titulo}»)`);
await juan.getByRole("tab", { name: /Diaria/ }).first().click().catch(() => juan.getByText("Diaria", { exact: true }).first().click());
await juan.waitForTimeout(800);
ok((await juan.locator("body").innerText()).includes("Despertar (lane 259)"), "y se muestra en la pestaña Diaria");
await juan.screenshot({ path: `${dir}/259-hijo.png` });

// Dispositivo nuevo del padre: no pisa la rutina de la familia (D4)
const papa2 = await dispositivo(1);
await papa2.goto(`${base}/dashboard/horarios`, { waitUntil: "networkidle" });
await papa2.waitForTimeout(2000);
const v2 = (await q(`SELECT "Version" v, "Etapas"->0->>'titulo' n FROM "Rutina_Familiar" WHERE id = 1`))[0];
ok(v2.n === "Despertar (lane 259)" && v2.v === rj.version, `un dispositivo nuevo no la pisa (versión ${v2.v}, «${v2.n}»)`);

await q(`DELETE FROM "Rutina_Familiar"`);
console.log("errores de consola:", errores.length ? errores : "ninguno");
console.log(fallas ? `${fallas} FALLAS` : "TODO OK");
await b.close();
await db.end();
