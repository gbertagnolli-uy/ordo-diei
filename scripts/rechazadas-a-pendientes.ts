// Pasa a Pendiente las tareas que quedaron en `Rechazada` antes de la lane 268 (Plane #25, D5/M6).
// A cada una le aplica lo mismo que hoy hace el rechazo (datosAlRechazar) y registra `Rechazada → Pendiente`
// en el historial a nombre del padre que la rechazó (último HistorialAccion con estadoNuevo = Rechazada).
// Si no hay registro de quién la rechazó, la deja como está y lo informa.
// Uso: npx tsx --env-file=.env.local scripts/rechazadas-a-pendientes.ts            (solo muestra)
//      npx tsx --env-file=.env.local scripts/rechazadas-a-pendientes.ts --aplicar
import prisma from "../src/lib/prisma";
import { registrarAccion } from "../src/lib/historial";
import { datosAlRechazar } from "../src/lib/tareas/rechazo";

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const ahora = new Date();
  const tareas = await prisma.tarea.findMany({
    where: { estado: "Rechazada" },
    select: {
      id: true,
      titulo: true,
      fechaVencimiento: true,
      horaEjecucion: true,
      asignado: { select: { nombre: true } },
      historialAcciones: {
        where: { estadoNuevo: "Rechazada" },
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { actorId: true },
      },
    },
    orderBy: { id: "asc" },
  });

  let hechas = 0;
  const sinActor: number[] = [];
  for (const t of tareas) {
    const actorId = t.historialAcciones[0]?.actorId;
    const datos = datosAlRechazar(t, ahora);
    const vence = "fechaVencimiento" in datos ? ` · vence ${datos.fechaVencimiento?.toISOString()}` : "";
    if (actorId === undefined) {
      sinActor.push(t.id);
      console.log(`#${t.id} ${t.asignado.nombre} · ${t.titulo}: sin registro de rechazo, no se toca`);
      continue;
    }
    console.log(`#${t.id} ${t.asignado.nombre} · ${t.titulo}: → Pendiente (actor ${actorId})${vence}`);
    if (!aplicar) continue;
    await prisma.$transaction(async (tx) => {
      // Solo si sigue en Rechazada (por si alguien la tocó mientras corría el script)
      const r = await tx.tarea.updateMany({ where: { id: t.id, estado: "Rechazada" }, data: datos });
      if (r.count === 1) {
        await registrarAccion(tx, { tareaId: t.id, actorId, estadoAnterior: "Rechazada", estadoNuevo: "Pendiente" });
        hechas++;
      }
    });
  }

  console.log(`\n${tareas.length} en Rechazada · ${sinActor.length} sin registro de rechazo${aplicar ? ` · ${hechas} pasadas a Pendiente` : " (dry-run, usá --aplicar)"}`);
}

main().catch(console.error).finally(() => process.exit(0));
