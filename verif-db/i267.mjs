import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const base = "http://localhost:3167";
await p.goto(base + "/", { waitUntil: "networkidle", timeout: 120000 });
console.log("inicio:", new URL(p.url()).pathname);
console.log("texto:", (await p.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 200));
await p.getByRole("button", { name: "Entrar" }).click(); await p.waitForTimeout(1200);
await p.getByText("Juan Prueba").first().click(); await p.waitForTimeout(800);
const inp = p.locator("input").first();
if (await inp.count()) { await inp.focus(); await p.keyboard.type("1234"); } else { for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).click(); }
await p.keyboard.press("Enter").catch(() => {});
await p.waitForURL(/dashboard/, { timeout: 60000 }); await p.waitForLoadState("networkidle"); await p.keyboard.press("Escape"); await p.waitForTimeout(800);
const u = new URL(p.url()); console.log("tras login:", u.pathname + u.search);
console.log("activo en sidebar:", (await p.locator('[data-active="true"]').allInnerTexts()).map(t => t.replace(/\s+/g," ")).join(" | "));
console.log("breadcrumb:", (await p.locator("nav[aria-label=breadcrumb]").first().innerText().catch(() => "?")).replace(/\s+/g, " "));
await p.screenshot({ path: process.argv[2] });
await b.close();
