// node consola.mjs <puerto> <userId> <ruta> — errores de consola y de página
import { chromium } from "playwright";
const [puerto, userId, ruta] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 300)); });
p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 300)));
const base = `http://localhost:${puerto}`;
await p.request.post(base + "/api/auth/login", { data: { userId: +userId, pinSecreto: "1234" } });
await p.goto(base + ruta, { waitUntil: "networkidle", timeout: 120000 });
await p.waitForTimeout(1500);
console.log(errs.length ? errs.join("\n") : "sin errores");
await b.close();
