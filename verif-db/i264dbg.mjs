// Diagnóstico de la lane 264: ¿por qué no aparece la ventana en /dashboard/habitos? node i264dbg.mjs <puerto>
import { chromium } from "playwright";
const base = `http://localhost:${process.argv[2]}`;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
await p.request.post(`${base}/api/auth/login`, { data: { userId: 3, pinSecreto: "1234" } });
console.log("timer start:", (await p.request.put(`${base}/api/tasks/26/timer`, { data: { action: "start" } })).status());
for (const ruta of ["/dashboard", "/dashboard/habitos", "/dashboard/cartas"]) {
  const r = await p.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
  const region = p.getByRole("region", { name: "Tarea en curso" });
  console.log(ruta, "→", new URL(p.url()).pathname, r.status(), "regiones:", await region.count(), "visible:", await region.isVisible().catch(() => false));
}
await p.screenshot({ path: "cap264/dbg-habitos.png" });
await b.close();
