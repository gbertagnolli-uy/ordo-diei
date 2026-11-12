import { chromium } from "playwright";
const [puerto, ruta] = process.argv.slice(2);
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.request.post(`${base}/api/auth/login`, { data: { userId: 1, pinSecreto: "1234" } });
await p.goto(base + ruta, { waitUntil: "networkidle", timeout: 180000 });
await p.waitForTimeout(800);
console.log(await p.evaluate(() => ({
  inset: !!document.querySelector('[data-slot="sidebar-inset"]'),
  bp: [...document.querySelectorAll('[data-slot="breadcrumb-page"]')].map((e) => [e.textContent, e.getBoundingClientRect().width]),
  dialogs: [...document.querySelectorAll('[role=dialog]')].map((d) => d.textContent.slice(0, 60)),
  headers: [...document.querySelectorAll("header")].map((h) => h.className.slice(0, 60)),
})));
await p.screenshot({ path: "sonda280.png" });
await b.close();
