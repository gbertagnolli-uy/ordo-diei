// M12 (e) de la lane 259: pausar y posponer no publican. node i259e.mjs <puerto>
import { chromium } from "playwright";
import pg from "pg";
const base = `http://localhost:${process.argv[2]}`;
const db = new pg.Client("postgresql://postgres:local@localhost:55432/ordo"); await db.connect();
const version = async () => (await db.query(`SELECT "Version" v FROM "Rutina_Familiar" WHERE id = 1`)).rows[0]?.v ?? 0;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const nueva = async (id) => { const p = await (await b.newContext({ viewport: { width: 1400, height: 900 }, timezoneId: "America/Montevideo" })).newPage(); await p.clock.install({ time: new Date("2026-11-07T08:10:00-03:00") }); await p.request.post(`${base}/api/auth/login`, { data: { userId: id, pinSecreto: "1234" } }); return p; };
await db.query(`DELETE FROM "Rutina_Familiar"`);
const papa = await nueva(1);
await papa.goto(`${base}/dashboard/horarios`, { waitUntil: "networkidle", timeout: 180000 }); await papa.waitForTimeout(2000);
const v0 = await version();
let posts = 0;
for (const id of [1, 3]) {
  const p = await nueva(id);
  p.on("request", (r) => r.method() === "POST" && r.url().endsWith("/api/rutina") && posts++);
  await p.goto(`${base}/dashboard/horarios`, { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
  const pausar = p.getByRole("button", { name: /^Pausar$/ });
  const mas5 = p.getByRole("button", { name: /\+5 min/ });
  console.log(`usuario ${id}: Pausar habilitado ${await pausar.first().isEnabled().catch(() => false)} · +5 min habilitado ${await mas5.first().isEnabled().catch(() => false)}`);
  if (await mas5.count() && await mas5.first().isEnabled()) { await mas5.first().click(); await p.waitForTimeout(800); }
  if (await pausar.count() && await pausar.first().isEnabled()) { await pausar.first().click(); await p.waitForTimeout(1500); }
  const aj = await p.evaluate(() => JSON.parse(localStorage.getItem("ordo_diei_rutina_config_v1") ?? "null")?.ajusteDia ?? null);
  console.log(`usuario ${id}: ajusteDia local ${aj ? JSON.stringify(aj).slice(0, 80) : "null"}`);
}
const v1 = await version();
console.log(v1 === v0 && posts === 0 ? `OK   (e) pausar y posponer no publican (versión ${v0} → ${v1}, POST ${posts})` : `FALLA (e) versión ${v0} → ${v1}, POST ${posts}`);
await db.query(`DELETE FROM "Rutina_Familiar"`);
await b.close(); await db.end();
