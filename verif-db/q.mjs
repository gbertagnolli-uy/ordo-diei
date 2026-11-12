// node q.mjs "<sql>" — consulta SOLO la base local
import pg from "pg";
const c = new pg.Client("postgresql://postgres:local@localhost:55432/ordo"); await c.connect();
const r = await c.query(process.argv[2]); console.table(r.rows); await c.end();
