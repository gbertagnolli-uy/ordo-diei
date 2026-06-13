const fs = require('fs');

const file = 'src/app/api/tasks/[id]/complete/route.ts';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `    // Regla de Recompensa
    let rewardPoints = 0;
    let feedback = "";`;

const replaceStr = `    // Regla de Recompensa`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(file, content);
console.log("Fixed vars 2");
