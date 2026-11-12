import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const base = "http://localhost:3165";
const errs = []; p.on("console", async (m) => { if (m.type() === "error") { const a = await Promise.all(m.args().slice(0, 4).map((x) => x.jsonValue().catch(() => "?"))); errs.push(a.map((x) => String(x).slice(0, 120)).join(" ¦ ")); } }); p.on("pageerror", (e) => errs.push("pageerror " + e.message.slice(0, 400)));
await p.request.post(base + "/api/auth/login", { data: { userId: 4, pinSecreto: "1234" } });
await p.goto(base + "/dashboard?s=today", { waitUntil: "networkidle", timeout: 120000 });
await p.keyboard.press("Escape"); await p.waitForTimeout(500);
await p.getByRole("row").filter({ hasText: "Checklist compartida (Ana)" }).first().click(); await p.waitForTimeout(800);
const btns = await p.getByRole("button").allInnerTexts();
console.log("botones:", btns.filter((t) => /check|lista|ítems|pasos/i.test(t)).join(" | "));
const abrir = p.locator('button').filter({ hasText: '1/3' }).filter({ hasNotText: 'compartida' }).last();
console.log('candidatos', await p.locator('button').filter({ hasText: '1/3' }).count());
if (await abrir.count()) { await abrir.click(); await p.waitForTimeout(1000); }
for (const t of ["Tender la cama", "Juntar la ropa", "Barrer"]) {
  const btn = p.getByRole("button").filter({ hasText: t }).last();
  console.log(t, "· disabled", await btn.isDisabled(), "·", (await btn.innerText()).replace(/\s+/g, " "));
}
await p.waitForTimeout(500);
console.log('ANIDADOS:', await p.evaluate(() => [...document.querySelectorAll('button button, button div, p div, button p')].slice(0,6).map(e => e.tagName + ' en ' + e.closest('button,p').tagName + ' · ' + (e.className||'').toString().slice(0,50) + ' · ' + e.closest('button,p').innerText.replace(/\s+/g,' ').slice(0,40)).join(' || ')));
console.log('ERRORES:', errs.length ? errs.join(' || ') : 'ninguno');
await p.screenshot({ path: process.argv[2] });
await b.close();
