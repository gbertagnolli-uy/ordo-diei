import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const task = await prisma.tarea.findUnique({
    where: { id: 27 },
    include: { checklistItems: true }
  });
  console.log(JSON.stringify(task, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
