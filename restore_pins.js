const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const salt = await bcrypt.genSalt(10);
  
  // Juan (id: 3) -> 0901
  const pinJuanHash = await bcrypt.hash('0901', salt);
  await prisma.usuario.update({
    where: { id: 3 },
    data: { pinSecretoHash: pinJuanHash }
  });
  console.log("PIN de Juan (id: 3) actualizado a 0901");

  // Gabriel (id: 1) -> 1109
  const pinGabrielHash = await bcrypt.hash('1109', salt);
  await prisma.usuario.update({
    where: { id: 1 },
    data: { pinSecretoHash: pinGabrielHash }
  });
  console.log("PIN de Gabriel (id: 1) actualizado a 1109");
}

main()
  .catch(e => console.error(e))
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
