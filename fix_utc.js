const fs = require('fs');

let content = fs.readFileSync('src/app/api/tasks/[id]/complete/route.ts', 'utf8');
content = content.replace(/now\.getHours\(\)/g, "now.getUTCHours()");
content = content.replace(/now\.getDay\(\)/g, "now.getUTCDay()");
fs.writeFileSync('src/app/api/tasks/[id]/complete/route.ts', content);

let content2 = fs.readFileSync('src/components/dashboard/NoticeBar.tsx', 'utf8');
content2 = content2.replace(/now\.getHours\(\)/g, "now.getUTCHours()");
fs.writeFileSync('src/components/dashboard/NoticeBar.tsx', content2);
