const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const task = await prisma.tarea.findUnique({
      where: { id: 27 },
      include: { checklistItems: true }
    });
    console.log('---START---');
    console.log(JSON.stringify(task, null, 2));
    console.log('---END---');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
