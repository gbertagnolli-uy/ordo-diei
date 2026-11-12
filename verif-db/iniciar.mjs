// Base local de verificación de Ordo Diei (NO es producción). Puerto 55432.
// Uso: node iniciar.mjs   (queda corriendo; Ctrl+C la detiene)
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const pg = new EmbeddedPostgres({
  databaseDir: new URL("./datos", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
  user: "postgres",
  password: "local",
  port: 55432,
  persistent: true,
  // UTF8 como producción: sin esto initdb toma el locale de Windows (WIN1252) y rompe emojis
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});
const primeraVez = !existsSync(new URL("./datos/PG_VERSION", import.meta.url));
if (primeraVez) await pg.initialise();
await pg.start();
if (primeraVez) await pg.createDatabase("ordo");
console.log("LISTA postgresql://postgres:local@localhost:55432/ordo");
const parar = async () => { await pg.stop(); process.exit(0); };
process.on("SIGINT", parar);
process.on("SIGTERM", parar);
