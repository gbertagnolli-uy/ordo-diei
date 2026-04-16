const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tasks = await prisma.tarea.findMany({
    where: { estado: 'Pendiente' },
    select: {
      id: true,
      titulo: true,
      asignadoId: true
    },
    take: 5
  });
  console.log(JSON.stringify(tasks, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
