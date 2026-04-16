const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const task = await prisma.tarea.findUnique({
    where: { id: 6 },
    select: {
      id: true,
      titulo: true,
      estado: true
    }
  });
  console.log(JSON.stringify(task, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
