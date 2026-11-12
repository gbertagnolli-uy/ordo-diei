// Lane 264: ¿el error de hidratación aparece con y sin tarea en curso? node i264hid.mjs <puerto>
import { chromium } from "playwright";
const base = `http://localhost:${process.argv[2]}`;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
async function probar(conTimer) {
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 }, timezoneId: "America/Montevideo" })).newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message.split("\n")[0].slice(0, 90)));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().split("\n")[0].slice(0, 90)));
  await p.request.post(`${base}/api/auth/login`, { data: { userId: 3, pinSecreto: "1234" } });
  await p.request.put(`${base}/api/tasks/26/timer`, { data: { action: conTimer ? "start" : "pause" } });
  for (const ruta of ["/dashboard/tienda", "/dashboard/cartas"]) {
    errs.length = 0;
    await p.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    console.log(conTimer ? "CON tarea en curso" : "SIN tarea en curso", ruta, errs.length ? errs : "sin errores");
  }
  await p.request.put(`${base}/api/tasks/26/timer`, { data: { action: "pause" } });
}
await probar(false);
await probar(true);
await b.close();
