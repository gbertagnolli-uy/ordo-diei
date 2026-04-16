import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando migración de recurrencias...");

  // Usar record<string, any> para evitar errores de tipo si el enum ya cambió
  const tareasMensuales = await prisma.tarea.findMany({
    where: {
      tipoRecurrencia: "Mensual" as any
    }
  });

  console.log(`Encontradas ${tareasMensuales.length} tareas mensuales para migrar.`);

  for (const tarea of tareasMensuales) {
    const dia = tarea.fechaVencimiento ? tarea.fechaVencimiento.getDate() : 1;
    
    await prisma.tarea.update({
      where: { id: tarea.id },
      data: {
        tipoRecurrencia: "Mensual_Fecha" as any,
        diaDelMes: dia
      }
    });
    console.log(`✔ Tarea ID ${tarea.id} migrada a Mensual_Fecha (Día ${dia}).`);
  }

  console.log("✅ Migración completada.");
}

main()
  .catch((e) => {
    console.error("❌ Error en migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
