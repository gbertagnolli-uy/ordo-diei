// Lane 278: enlaces de la ola 3 en el sidebar. node i278.mjs <puerto> <carpeta>
import { chromium } from "playwright";
const [puerto, dir] = process.argv.slice(2);
const base = `http://localhost:${puerto}`;
const b = await chromium.launch({ executablePath: "C:/Users/evoxu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errores = [];
p.on("pageerror", (e) => errores.push(e.message.slice(0, 160)));
await p.request.post(`${base}/api/auth/login`, { data: { userId: 3, pinSecreto: "1234" } });
await p.goto(`${base}/dashboard/tienda`, { waitUntil: "networkidle", timeout: 180000 });
let fallas = 0;
for (const [nombre, href] of [["Premio grupal", "/dashboard/premio-grupal"], ["Biblioteca", "/dashboard/biblioteca"], ["Notas", "/dashboard/notas"], ["Mi diario", "/dashboard/diario"], ["Diario familiar", "/dashboard/diario/familia"]]) {
  const l = p.locator(`[data-sidebar='menu-button'][href='${href}']`);
  const ok = (await l.count()) === 1 && (await l.innerText()).includes(nombre);
  if (!ok) fallas++;
  console.log(ok ? "OK  " : "FALLA", nombre, href);
}
const grupo = await p.getByText("Lectura y escritura", { exact: true }).count();
console.log(grupo === 1 ? "OK   grupo «Lectura y escritura»" : "FALLA grupo"); if (grupo !== 1) fallas++;
await p.screenshot({ path: `${dir}/278-sidebar.png` });
console.log("errores:", errores.length ? errores : "ninguno");
console.log(fallas ? `${fallas} FALLAS` : "TODO OK");
await b.close();
