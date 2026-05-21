const fs = require('fs');
let file = 'src/components/dashboard/ModalManager.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `        </Modal>
      )}

      {type === "TASK_SUCCESS" && (`;

const replaceStr = `        </Modal>
      )}

      {type === "TASK_SUCCESS" && (`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(file, content);
console.log("Fixed modal syntax");
