import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const base = "http://localhost:3175";
async function sesion(id){ const c = await b.newContext({viewport:{width:1280,height:900}}); const p = await c.newPage(); await p.request.post(base+"/api/auth/login",{data:{userId:id,pinSecreto:"1234"}}); return p; }
// Hijo: menú de usuario › Mis logros
let p = await sesion(3);
await p.goto(base+"/dashboard?s=today",{waitUntil:"networkidle"});
await p.keyboard.press("Escape");
await p.getByText("Juan Prueba",{exact:true}).last().click();
const item = p.getByRole("menuitem",{name:"Mis logros"});
console.log("menú › Mis logros visible:", await item.isVisible());
await item.click(); await p.waitForURL(/\/dashboard\/logros/); console.log("navega a:", new URL(p.url()).pathname);
const filas = () => p.locator('[aria-label^="Progreso de"]').filter({ visible: true }).count();
const antes = await filas(); await p.getByText("Constancia",{exact:true}).click(); await p.waitForTimeout(500);
const abierta = await filas(); await p.getByText("Constancia",{exact:true}).click(); await p.waitForTimeout(500);
console.log("filas con contador: inicial", antes, "· al abrir Constancia", abierta, "· al cerrarla", await filas());
// Padre: perfil del hijo › Ver logros
p = await sesion(1);
const r = await p.goto(base+"/dashboard/perfil?usuarioId=3",{waitUntil:"networkidle"}); console.log("perfil/3 status", r.status());
const ver = p.getByRole("link",{name:"Ver logros"}); console.log("Ver logros:", await ver.count(), await ver.first().getAttribute("href").catch(()=>null));
await b.close();
