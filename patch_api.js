const fs = require('fs');

let content = fs.readFileSync('src/app/api/tasks/[id]/complete/route.ts', 'utf8');

const happyHourLogic = `    // Regla de Recompensa
    let rewardPoints = 0;
    let feedback = "";
    const estadoFinal = "Esperando_Aprobacion";

    // Happy Hour check (17:00 - 19:00)
    const currentHour = now.getHours();
    const isHappyHour = currentHour >= 17 && currentHour < 19;
    let happyHourMultiplier = isHappyHour ? 1.5 : 1;

    if (task.generaPuntosYRecompensa) {
      // Dynamic base points based on estimated time (1 point per minute, minimum 10)
      const basePoints = Math.max(10, Math.floor((task.tiempoEjecucionEstimadoSeg || 0) / 60));

      // Streak bonus: +2 points per streak day, max +20 points
      const streakBonus = Math.max(0, Math.min(20, (newStreakDays - 1) * 2));

      if (esATiempo) {
        rewardPoints = Math.floor((basePoints + streakBonus) * happyHourMultiplier);
        feedback = \`¡Buen trabajo! Completaste la tarea a tiempo. Obtuviste \${basePoints} pts base y \${streakBonus} pts de bono por racha.\`;
        if (isHappyHour) feedback += " ¡Bono de Happy Hour (1.5x) aplicado!";
      } else if (estaEnPeriodoGracia) {
        rewardPoints = Math.floor(((basePoints + streakBonus) / 2) * happyHourMultiplier);
        feedback = "Tarea completada con retraso (50% puntos).";
        if (isHappyHour) feedback += " ¡Bono de Happy Hour (1.5x) aplicado!";
      } else {
        rewardPoints = 0;
        feedback = "Tarea completada fuera del período de gracia. No hay puntos.";
      }
    } else {
      feedback = "Tarea marcada como realizada. No genera puntos.";
    }`;

// remove old reward logic blocks
content = content.replace(/    \/\/ Regla de Recompensa\s+let rewardPoints = 0;\s+let feedback = "";\s+const estadoFinal = "Esperando_Aprobacion";\s+if \(task\.generaPuntosYRecompensa\) \{\s+if \(esATiempo\) \{\s+rewardPoints = 50;\s+feedback = "¡Buen trabajo! Completaste la tarea a tiempo\.";\s+\} else if \(estaEnPeriodoGracia\) \{\s+rewardPoints = 25;\s+feedback = "Tarea completada con retraso \(50% puntos\)\.";\s+\} else \{\s+rewardPoints = 0;\s+feedback = "Tarea completada fuera del período de gracia\. No hay puntos\.";\s+\}\s+\} else \{\s+feedback = "Tarea marcada como realizada\. No genera puntos\.";\s+\}/, '');

content = content.replace(/    \/\/ Regla de Recompensa\s+let rewardPoints = 0;\s+let feedback = "";\s+if \(task\.generaPuntosYRecompensa\) \{\s+\/\/ Dynamic base points based on estimated time \(1 point per minute, minimum 10\)\s+const basePoints = Math\.max\(10, Math\.floor\(\(task\.tiempoEjecucionEstimadoSeg \|\| 0\) \/ 60\)\);\s+\/\/ Streak bonus: \+2 points per streak day, max \+20 points\s+const streakBonus = Math\.max\(0, Math\.min\(20, \(newStreakDays - 1\) \* 2\)\);\s+if \(esATiempo\) \{\s+rewardPoints = basePoints \+ streakBonus;\s+feedback = `¡Buen trabajo! Completaste la tarea a tiempo\. Obtuviste \$\{basePoints\} pts base y \$\{streakBonus\} pts de bono por racha\.`;\s+\} else if \(estaEnPeriodoGracia\) \{\s+rewardPoints = Math\.floor\(\(basePoints \+ streakBonus\) \/ 2\);\s+feedback = "Tarea completada con retraso \(50% puntos\)\.";\s+\} else \{\s+rewardPoints = 0;\s+feedback = "Tarea completada fuera del período de gracia\. No hay puntos\.";\s+\}\s+\} else \{\s+feedback = "Tarea marcada como realizada\. No genera puntos\.";\s+\}/, happyHourLogic);

fs.writeFileSync('src/app/api/tasks/[id]/complete/route.ts', content);
