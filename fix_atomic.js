const fs = require('fs');

// /complete/route.ts
let completePath = 'src/app/api/tasks/[id]/complete/route.ts';
let contentComplete = fs.readFileSync(completePath, 'utf8');

contentComplete = contentComplete.replace(
  `      prisma.tarea.update({
        where: { id: taskId },
        data: {
          estado: "Esperando_Aprobacion",`,
  `      prisma.tarea.update({
        where: { id: taskId, estado: task.estado }, // Atomic condition
        data: {
          estado: "Esperando_Aprobacion",`
);
fs.writeFileSync(completePath, contentComplete);

// /approve/route.ts
let approvePath = 'src/app/api/tasks/[id]/approve/route.ts';
let contentApprove = fs.readFileSync(approvePath, 'utf8');

contentApprove = contentApprove.replace(
  `      prisma.tarea.update({
        where: { id: taskId },
        data: { estado: "Aprobada" }`,
  `      prisma.tarea.update({
        where: { id: taskId, estado: "Esperando_Aprobacion" }, // Atomic condition
        data: { estado: "Aprobada" }`
);
fs.writeFileSync(approvePath, contentApprove);
