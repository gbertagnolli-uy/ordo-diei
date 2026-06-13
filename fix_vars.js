const fs = require('fs');

const file = 'src/app/api/tasks/[id]/complete/route.ts';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `    const estadoFinal = "Esperando_Aprobacion";`;

const replaceStr = `    let rewardPoints = 0;
    let feedback = "";
    const estadoFinal = "Esperando_Aprobacion";`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(file, content);
console.log("Fixed vars");
