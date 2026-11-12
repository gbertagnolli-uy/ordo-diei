// Ejecuta un archivo SQL SOLO contra la base local (la URL está fija acá, nunca se lee del entorno).
import pg from "pg";
import { readFileSync } from "node:fs";
const URL_LOCAL = "postgresql://postgres:local@localhost:55432/ordo";
const archivo = process.argv[2];
if (!archivo) { console.error("uso: node aplicar-sql.mjs <archivo.sql>"); process.exit(1); }
const c = new pg.Client({ connectionString: URL_LOCAL });
await c.connect();
await c.query(readFileSync(archivo, "utf8"));
const { rows } = await c.query("select count(*)::int n from information_schema.tables where table_schema='public'");
console.log("tablas:", rows[0].n);
await c.end();
