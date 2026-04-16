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
  const pinSecretoHash = await bcrypt.hash('1234', salt);
  
  await prisma.usuario.update({
    where: { id: 1 },
    data: { pinSecretoHash }
  });
  
  console.log("PIN de Gabriel (id: 1) actualizado a 1234");
}

main()
  .catch(e => console.error(e))
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
