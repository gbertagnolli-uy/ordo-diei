const fs = require('fs');

const file = 'src/app/api/tasks/[id]/complete/route.ts';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `    // Regla de Recompensa
    let rewardPoints = 0;
    let feedback = "";
    const estadoFinal = "Esperando_Aprobacion";

    if (task.generaPuntosYRecompensa) {
      if (esATiempo) {
        rewardPoints = 50;
        feedback = "¡Buen trabajo! Completaste la tarea a tiempo.";
      } else if (estaEnPeriodoGracia) {
        rewardPoints = 25;
        feedback = "Tarea completada con retraso (50% puntos).";
      } else {
        rewardPoints = 0;
        feedback = "Tarea completada fuera del período de gracia. No hay puntos.";
      }
    } else {
      feedback = "Tarea marcada como realizada. No genera puntos.";
    }

    // Lógica de Rachas (Streaks)`;

const replaceStr = `    const estadoFinal = "Esperando_Aprobacion";

    // Lógica de Rachas (Streaks)`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(file, content);
console.log("Fixed complete route");
