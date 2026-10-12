// Borra tareas Pendientes duplicadas (misma persona + mismo título + mismo día).
// Solo toca filas intactas: sin tiempo consumido, sin cronómetro y sin historial.
// Uso: npx tsx scripts/limpiar-tareas-duplicadas.ts          (solo muestra)
//      npx tsx scripts/limpiar-tareas-duplicadas.ts --aplicar
import prisma from "../src/lib/prisma";

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const tareas = await prisma.tarea.findMany({
    where: { estado: "Pendiente" },
    include: { asignado: { select: { nombre: true } }, historialAcciones: { select: { id: true } }, checklistItems: { select: { completado: true } } },
    orderBy: { id: "asc" },
  });

  const series = new Map<string, typeof tareas>();
  for (const t of tareas) {
    const dia = t.fechaVencimiento?.toISOString().slice(0, 10) ?? "sin-fecha";
    const clave = `${t.asignadoId}|${t.titulo.trim().toLowerCase()}|${dia}`;
    series.set(clave, [...(series.get(clave) ?? []), t]);
  }

  const borrar: number[] = [];
  for (const filas of series.values()) {
    if (filas.length < 2) continue;
    // Se conserva la que tenga checklist (o el grupo) y, si empatan, la más vieja
    const [conservar, ...resto] = [...filas].sort((a, b) =>
      Number(b.checklistItems.length > 0) - Number(a.checklistItems.length > 0) || a.id - b.id);
    const intactas = resto.filter(t =>
      t.tiempoConsumidoTotalSeg === 0 && !t.timerStartedAt && t.tiempoAcumuladoTimer === 0
      && t.historialAcciones.length === 0 && t.checklistItems.every(c => !c.completado));
    console.log(`${conservar.asignado.nombre} · ${conservar.titulo}: conserva #${conservar.id}, borra ${intactas.map(t => "#" + t.id).join(" ") || "(nada)"}`);
    borrar.push(...intactas.map(t => t.id));
  }

  console.log(`\n${borrar.length} duplicadas${aplicar ? " — borrando" : " (dry-run, usá --aplicar)"}`);
  if (aplicar && borrar.length) {
    const r = await prisma.tarea.deleteMany({ where: { id: { in: borrar }, estado: "Pendiente" } });
    console.log(`Borradas: ${r.count}`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
