import { chromium } from "playwright";
const [puerto, ruta, uid] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await b.newPage();
p.on("response", (r) => r.status() >= 400 && console.log(r.status(), r.url()));
await p.request.post(`http://localhost:${puerto}/api/auth/login`, { data: { userId: +uid, pinSecreto: "1234" } });
await p.goto(`http://localhost:${puerto}${ruta}`, { waitUntil: "networkidle", timeout: 120000 });
await b.close();
