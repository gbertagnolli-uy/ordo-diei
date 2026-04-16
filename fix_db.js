require('dotenv').config();
const { Pool } = require('pg');

async function fix() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`UPDATE "Usuarios" SET "Rol_Familiar" = 'Hijo' WHERE "Rol_Familiar" = 'Hijo Mayor'`);
    console.log("Usuarios reparados:", res.rowCount);
  } catch (e) {
    if (e.message.includes('invalid input value for enum')) {
       // if 'Hijo' doesn't exist yet, we do it after push
       console.log("Hijo no existe, lo posponemos");
    } else {
       console.error(e);
    }
  } finally {
    pool.end();
  }
}
fix();
