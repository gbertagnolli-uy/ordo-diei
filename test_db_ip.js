const { Client } = require('pg');
require('dotenv').config();

// Testing Connection via IP Address (Bypassing DNS/IPv6 issues)
// IP 54.94.90.106 corresponds to the sa-east-1 pooler
const client = new Client({
  connectionString: "postgresql://postgres.bdtwgibxxakgeedpwtde:%40wURmqX-J8pUFr2@54.94.90.106:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function test() {
  console.log("Connecting to Supabase Pooler via IP (54.94.90.106)...");
  try {
    await client.connect();
    console.log("Success! Connection established via IP bridge.");
    const res = await client.query('SELECT NOW()');
    console.log("Server time:", res.rows[0].now);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

test();
