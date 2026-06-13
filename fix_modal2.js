const fs = require('fs');
let file = 'src/components/dashboard/ModalManager.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `    </div>
  );
}

function RulesPopup() {`;

const replaceStr = `    </div>
  );
}

function RulesPopup() {`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(file, content);
console.log("Fixed UserStatsPopup bracket");
