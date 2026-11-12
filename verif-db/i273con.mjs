import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const c = await b.newContext({ timezoneId: "America/Montevideo", locale: "es-UY" }); const p = await c.newPage();
await p.request.post("http://localhost:3173/api/auth/login", { data: { userId: 3, pinSecreto: "1234" } });
await p.goto("http://localhost:3173/dashboard/imprimir/agenda-semanal", { waitUntil: "networkidle" });
const t = await p.locator(".hoja-agenda-semanal section").nth(5).innerText();
console.log(/Checklist compartida[\s\S]*Con Ana Prueba/.test(t) ? "OK   la compartida sigue mostrando «Con Ana Prueba»" : "FALLA compartida: " + t.slice(-400));
await b.close();
