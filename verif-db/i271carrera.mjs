// ¿El primer pull pisa lo que se escribe? node i271carrera.mjs <puerto>
import { chromium } from "playwright";
const [puerto] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const base = `http://localhost:${puerto}`;
for (let ronda = 1; ronda <= 3; ronda++) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.request.post(`${base}/api/auth/login`, { data: { userId: 3, pinSecreto: "1234" } });
  await p.goto(`${base}/dashboard/notas-humo`, { waitUntil: "domcontentloaded", timeout: 180000 });
  await p.locator(".bn-editor").first().waitFor({ timeout: 60000 });
  const TXT = `carrera${ronda}x${Date.now()}`;
  const est0 = (await p.getByTestId("estado").textContent())?.trim();
  await p.locator(".bn-editor").first().click();
  await p.keyboard.type(TXT, { delay: 40 });
  await p.keyboard.press("Enter");
  await p.keyboard.type("/");
  const log = [];
  for (let i = 0; i < 20; i++) {
    log.push(`${await p.locator("#bn-suggestion-menu").count()}`);
    await p.waitForTimeout(150);
  }
  await p.keyboard.press("Escape");
  await p.waitForTimeout(3000);
  const titulo = await p.locator("h1").first().textContent();
  const tiene = (await p.locator(".bn-editor").first().textContent())?.includes(TXT);
  console.log(`ronda ${ronda}: estado al abrir="${est0}" · menú en el tiempo=${log.join("")} · h1="${titulo}" · texto sigue=${tiene} · estado final="${(await p.getByTestId("estado").textContent())?.trim()}"`);
  await ctx.close();
}
await b.close();
