import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const base = "http://localhost:" + process.argv[2];
await p.request.post(base + "/api/auth/login", { data: { userId: 3, pinSecreto: "1234" } });
for (const vista of ["list"]) {
  await p.goto(base + "/dashboard?s=today", { waitUntil: "networkidle", timeout: 120000 });
  await p.keyboard.press("Escape");
  if (vista === "board") { await p.getByRole("button", { name: "Tablero" }).click(); await p.waitForTimeout(600); }
  const panel = p.locator('aside[aria-label="Agenda"], [aria-label="Agenda"]').first();
  const y0 = (await panel.boundingBox())?.y;
  await p.mouse.wheel(0, 600); await p.waitForTimeout(500);
  const y1 = (await panel.boundingBox())?.y;
  console.log(vista, "panel y antes", Math.round(y0), "después de scrollear 600", Math.round(y1), "scrollY", await p.evaluate(() => scrollY));
  await p.screenshot({ path: process.argv[3].replace(".png", `-${vista}.png`) });
}
await b.close();
