// Refresca el pool de fotos de Unsplash a mano (lo mismo que hace el cron diario y el botón
// «Cargar fotos ahora»). Usa la clave del .env y escribe en Fotos_Unsplash / Config_Reposo.
//   node scripts/reposo/refrescar.ts
import { repoReposo } from "../../src/lib/reposo/repositorio.ts";
import { refrescarPoolUnsplash } from "../../src/lib/reposo/unsplash.ts";

const r = await refrescarPoolUnsplash(repoReposo, {
  fetch,
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  log: (m) => console.error(m),
});
console.log(JSON.stringify(r));
process.exit(r.ok ? 0 : 1);
