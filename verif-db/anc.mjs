import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const base = "http://localhost:3161";
await p.request.post(base + "/api/auth/login", { data: { userId: 3, pinSecreto: "1234" } });
await p.goto(base + "/dashboard?s=today", { waitUntil: "networkidle", timeout: 120000 });
const r = await p.evaluate(() => {
  const el = document.querySelector('[aria-label="Agenda"]');
  const out = [];
  for (let e = el; e; e = e.parentElement) {
    const s = getComputedStyle(e);
    out.push(`${e.tagName} pos=${s.position} top=${s.top} ovx=${s.overflowX} ovy=${s.overflowY} h=${e.clientHeight} cls=${(e.className||"").toString().slice(0,70)}`);
  }
  return out;
});
console.log(r.join("\n"));
await b.close();
