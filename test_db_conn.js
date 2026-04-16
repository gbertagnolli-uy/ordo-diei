const { Client } = require('pg');
require('dotenv').config();

// Testing Pooled Connection with [user].[ref] format
const client = new Client({
  connectionString: "postgresql://postgres.bdtwgibxxakgeedpwtde:%40wURmqX-J8pUFr2@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer_true",
  ssl: { rejectUnauthorized: false }
});

async function test() {
  console.log("Connecting to Supabase Pooler (User.Ref format)...");
  try {
    await client.connect();
    console.log("Success! Authenticated via IPv4 Pooler.");
    const res = await client.query('SELECT NOW()');
    console.log("Server time:", res.rows[0].now);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

test();
