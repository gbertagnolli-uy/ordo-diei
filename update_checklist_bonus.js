const fs = require('fs');

const file = 'src/app/api/tasks/[id]/complete/route.ts';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `      // Streak bonus: +2 points per streak day, max +20 points
      const streakBonus = Math.max(0, Math.min(20, (newStreakDays - 1) * 2));`;

const replaceStr = `      // Streak bonus: +2 points per streak day, max +20 points
      const streakBonus = Math.max(0, Math.min(20, (newStreakDays - 1) * 2));

      // Checklist Bonus
      let checklistBonus = 0;
      if (task.isChecklist && task.checklistItems && task.checklistItems.length > 0) {
          const completedItems = task.checklistItems.filter(ci => ci.completado).length;
          checklistBonus = completedItems * 5; // 5 pts por cada item
      }`;

content = content.replace(searchStr, replaceStr);

const rewardSearch = `        rewardPoints = basePoints + streakBonus;`;
const rewardReplace = `        rewardPoints = basePoints + streakBonus + checklistBonus;`;
content = content.replace(rewardSearch, rewardReplace);

const feedbackSearch = `feedback = \`¡Buen trabajo! Completaste la tarea a tiempo. Obtuviste \${basePoints} pts base \${isHappyHour ? '(Happy Hour x1.5!) ' : ''}y \${streakBonus} pts de bono por racha.\`;`;
const feedbackReplace = `feedback = \`¡Buen trabajo! Completaste la tarea a tiempo. Obtuviste \${basePoints} pts base \${isHappyHour ? '(Happy Hour x1.5!) ' : ''}y \${streakBonus} pts de bono por racha\${checklistBonus > 0 ? \` + \${checklistBonus} pts por checklist\` : ''}.\`;`;
content = content.replace(feedbackSearch, feedbackReplace);

const graceRewardSearch = `        rewardPoints = Math.floor((basePoints + streakBonus) / 2);`;
const graceRewardReplace = `        rewardPoints = Math.floor((basePoints + streakBonus + checklistBonus) / 2);`;
content = content.replace(graceRewardSearch, graceRewardReplace);


fs.writeFileSync(file, content);
console.log("Success Checklist Bonus");
