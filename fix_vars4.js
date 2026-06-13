const fs = require('fs');

const file = 'src/app/api/tasks/[id]/complete/route.ts';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `    if (asignado && task.generaPuntosYRecompensa) {
      // Dynamic base points based on estimated time (1 point per minute, minimum 10)`;

const replaceStr = `    let rewardPoints = 0;
    let feedback = "";

    if (asignado && task.generaPuntosYRecompensa) {
      // Dynamic base points based on estimated time (1 point per minute, minimum 10)`;

// First replace all occurrences of `let rewardPoints = 0;` and `let feedback = "";` to empty string
content = content.replace(/let rewardPoints = 0;\n\s*let feedback = "";/g, '');

content = content.replace(`    if (task.generaPuntosYRecompensa) {
      // Dynamic base points based on estimated time (1 point per minute, minimum 10)`, `    let rewardPoints = 0;
    let feedback = "";

    if (task.generaPuntosYRecompensa) {
      // Dynamic base points based on estimated time (1 point per minute, minimum 10)`);

fs.writeFileSync(file, content);
console.log("Fixed vars 4");
