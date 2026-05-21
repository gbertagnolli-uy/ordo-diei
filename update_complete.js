const fs = require('fs');

const file = 'src/app/api/tasks/[id]/complete/route.ts';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `      const basePoints = Math.max(10, Math.floor((task.tiempoEjecucionEstimadoSeg || 0) / 60));

      // Streak bonus: +2 points per streak day, max +20 points
      const streakBonus = Math.max(0, Math.min(20, (newStreakDays - 1) * 2));`;

const replaceStr = `      let basePoints = Math.max(10, Math.floor((task.tiempoEjecucionEstimadoSeg || 0) / 60));

      // Happy Hour Bonus (15:00 - 18:00 local time assumption)
      const currentHour = new Date().getHours();
      let isHappyHour = currentHour >= 15 && currentHour < 18;
      if (isHappyHour) {
          basePoints = Math.floor(basePoints * 1.5);
      }

      // Streak bonus: +2 points per streak day, max +20 points
      const streakBonus = Math.max(0, Math.min(20, (newStreakDays - 1) * 2));`;

content = content.replace(searchStr, replaceStr);

const feedbackSearch = `feedback = \`¡Buen trabajo! Completaste la tarea a tiempo. Obtuviste \${basePoints} pts base y \${streakBonus} pts de bono por racha.\`;`;
const feedbackReplace = `feedback = \`¡Buen trabajo! Completaste la tarea a tiempo. Obtuviste \${basePoints} pts base \${isHappyHour ? '(Happy Hour x1.5!) ' : ''}y \${streakBonus} pts de bono por racha.\`;`;

content = content.replace(feedbackSearch, feedbackReplace);

fs.writeFileSync(file, content);
console.log("Success complete route");
