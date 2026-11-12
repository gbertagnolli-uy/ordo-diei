import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
await p.request.post("http://localhost:3171/api/auth/login", { data: { userId: 3, pinSecreto: "1234" } });
await p.goto("http://localhost:3171/dashboard/notas", { waitUntil: "networkidle", timeout: 180000 });
await p.locator('aside[aria-label="Barra lateral"]').waitFor({ state: "attached", timeout: 90000 });
await p.waitForTimeout(2500);
await p.getByRole("button", { name: "Abrir la barra lateral" }).first().click();
await p.waitForTimeout(600);
console.log(await p.evaluate(() => {
  let el = document.elementFromPoint(38, 805); const out = [];
  while (el && el !== document.body) { const cs = getComputedStyle(el); out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 70)} pos=${cs.position} z=${cs.zIndex}`); el = el.parentElement; }
  return out.join("\n");
}));
await b.close();
