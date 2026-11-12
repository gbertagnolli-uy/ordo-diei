// node captura.mjs <puerto> <userId> <ruta> <salida.png> [ancho]  — login con PIN 1234 + captura
// Usa el Chromium ya instalado de Playwright (variable CHROME para cambiarlo).
import { chromium } from "playwright";
const [puerto, userId, ruta, salida, ancho = "1280"] = process.argv.slice(2);
const CHROME = process.env.CHROME ?? "C:\\Users\\evoxu\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe";
const b = await chromium.launch({ executablePath: CHROME });
const p = await b.newPage({ viewport: { width: +ancho, height: 900 } });
const base = `http://localhost:${puerto}`;
const r = await p.request.post(`${base}/api/auth/login`, { data: { userId: +userId, pinSecreto: "1234" } });
if (!r.ok()) { console.error("login", r.status()); process.exit(1); }
await p.goto(base + ruta, { waitUntil: "networkidle", timeout: 120000 });
await p.screenshot({ path: salida, fullPage: false });
console.log("ok", salida);
await b.close();
