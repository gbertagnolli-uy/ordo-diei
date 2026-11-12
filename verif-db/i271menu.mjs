// Diagnóstico: ¿qué cierra el menú "/"? node i271menu.mjs <puerto>
import { chromium } from "playwright";
const [puerto] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const base = `http://localhost:${puerto}`;
await p.request.post(`${base}/api/auth/login`, { data: { userId: 3, pinSecreto: "1234" } });
await p.goto(`${base}/dashboard/notas-humo`, { waitUntil: "networkidle", timeout: 180000 });
await p.locator(".bn-editor").first().waitFor({ timeout: 60000 });
for (const espera of [0, 6000]) {
  await p.waitForTimeout(espera);
  console.log(`--- tras esperar ${espera} ms; estado:`, (await p.getByTestId("estado").textContent())?.trim());
  await p.locator(".bn-editor").first().click();
  await p.keyboard.press("End");
  await p.keyboard.press("Enter");
  await p.keyboard.type("/");
  const t0 = Date.now();
  for (let i = 0; i < 12; i++) {
    const n = await p.locator("#bn-suggestion-menu").count();
    const op = n ? await p.locator("#bn-suggestion-menu").evaluate((e) => getComputedStyle(e).opacity) : "-";
    const foco = await p.evaluate(() => document.activeElement?.className?.toString().slice(0, 40));
    console.log(`${Date.now() - t0}ms menú=${n} opacidad=${op} foco=${foco}`);
    await p.waitForTimeout(150);
  }
  await p.keyboard.press("Escape");
}
await b.close();
