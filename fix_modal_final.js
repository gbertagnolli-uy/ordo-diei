const fs = require('fs');
let file = 'src/components/dashboard/ModalManager.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `      <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">`;

const replaceStr = `      </div>
      <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(file, content);
console.log("Fixed UserStatsPopup brackets finally");
