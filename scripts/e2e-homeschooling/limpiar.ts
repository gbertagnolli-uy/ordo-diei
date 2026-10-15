import { prisma } from "./lib.ts";
const marca = "__test_hs";
const usuarios = (await prisma.usuario.findMany({ where: { nombre: { contains: marca } }, select: { id: true } })).map((u) => u.id);
const tareas = (await prisma.tarea.findMany({ where: { OR: [{ titulo: { contains: marca } }, { creadorId: { in: usuarios } }, { asignadoId: { in: usuarios } }] }, select: { id: true } })).map((t) => t.id);
const n: Record<string, number> = {};
n.historial = (await prisma.historialAccion.deleteMany({ where: { OR: [{ tareaId: { in: tareas } }, { actorId: { in: usuarios } }] } })).count;
n.materias = (await prisma.materia.deleteMany({ where: { OR: [{ nombre: { contains: marca } }, { creadorId: { in: usuarios } }] } })).count; // cascada: cursos, lecciones, planes, días, actividades, metas
n.historias = (await prisma.historiaSocial.deleteMany({ where: { OR: [{ titulo: { contains: "Vamos al médico" }, alumnoId: { in: usuarios } }, { alumnoId: { in: usuarios } }] } })).count;
n.tareas = (await prisma.tarea.deleteMany({ where: { id: { in: tareas } } })).count;
n.archivos = (await prisma.archivo.deleteMany({ where: { subidoPorId: { in: usuarios } } })).count;
n.usuarios = (await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } })).count;
console.log("borrado:", JSON.stringify(n));
console.log("restos:", JSON.stringify({ usuarios: await prisma.usuario.count({ where: { nombre: { contains: marca } } }), materias: await prisma.materia.count({ where: { nombre: { contains: marca } } }), tareas: await prisma.tarea.count({ where: { titulo: { contains: marca } } }), usuariosTotal: await prisma.usuario.count(), materiasTotal: await prisma.materia.count() }));
await prisma.$disconnect();
