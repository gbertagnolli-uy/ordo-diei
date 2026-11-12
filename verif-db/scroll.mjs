// node scroll.mjs <puerto> <userId> <ancho> <alto> <salida.png> — mide barras de scroll en /dashboard (Lista)
import { chromium } from "playwright";
const [puerto, userId, ancho, alto, salida] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await b.newPage({ viewport: { width: +ancho, height: +alto } });
const base = `http://localhost:${puerto}`;
await p.request.post(base + "/api/auth/login", { data: { userId: +userId, pinSecreto: "1234" } });
await p.goto(base + "/dashboard?s=today", { waitUntil: "networkidle", timeout: 120000 });
await p.keyboard.press("Escape"); await p.waitForTimeout(800);
const r = await p.evaluate(() => {
  const d = document.scrollingElement;
  const cajas = [...document.querySelectorAll("*")].filter((e) => {
    const s = getComputedStyle(e);
    return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2 && e.clientHeight > 150;
  }).map((e) => ({ clase: (e.className || "").toString().slice(0, 90), alto: e.clientHeight, contenido: e.scrollHeight }));
  return { pagina: { alto: innerHeight, contenido: d.scrollHeight, scrollea: d.scrollHeight > innerHeight + 2 }, cajas };
});
console.log(JSON.stringify(r, null, 1));
await p.screenshot({ path: salida });
await b.close();
