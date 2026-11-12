// ¿Un enlace #p-<id> abierto en un navegador nuevo abre la página después del primer sync?
import { chromium } from "playwright";
const base = "http://localhost:3171";
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
async function entrar() { const c = await b.newContext(); const p = await c.newPage(); await p.request.post(`${base}/api/auth/login`, { data: { userId: 3, pinSecreto: "1234" } }); return p; }
const a = await entrar();
await a.goto(`${base}/dashboard/notas`, { waitUntil: "networkidle", timeout: 180000 });
await a.locator('aside[aria-label="Barra lateral"]').waitFor({ timeout: 90000 }); await a.waitForTimeout(4000);
await a.locator('aside[aria-label="Barra lateral"] li[role="treeitem"]').first().click(); await a.waitForTimeout(1500);
const hash = a.url().split("#")[1]; const titulo = await a.locator("#page-title").inputValue();
const n = await entrar();
await n.goto(`${base}/dashboard/notas#${hash}`, { waitUntil: "networkidle", timeout: 180000 });
await n.locator('aside[aria-label="Barra lateral"]').waitFor({ timeout: 90000 }); await n.waitForTimeout(8000);
console.log("hash pedido", hash, "| url final", n.url().split("#")[1] ?? "(sin hash)", "| título visible:", await n.locator("#page-title").count() ? await n.locator("#page-title").inputValue() : "(ninguna página abierta)", "| esperado:", titulo);
await b.close();
