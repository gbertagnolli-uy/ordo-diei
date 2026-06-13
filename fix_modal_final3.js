const fs = require('fs');
let file = 'src/components/dashboard/ModalManager.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `      <div className="flex flex-col gap-2">
      {/* Sección de Logros Resumidos */}`;

const replaceStr = `      {/* Sección de Logros Resumidos */}`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(file, content);
console.log("Fixed UserStatsPopup bracket correctly 3");
