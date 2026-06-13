const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/ModalManager.tsx', 'utf8');

const regex = /function UserStatsPopup\(\{ user \}: \{ user: any \}\) \{([\s\S]*?)function RulesPopup\(\) \{/g;
const match = regex.exec(content);

if (match) {
   let functionBody = match[1];
   let opens = (functionBody.match(/<div/g) || []).length;
   let closes = (functionBody.match(/<\/div>/g) || []).length;
   console.log("div count: ", opens, closes);

   // It seems we have one more <div... than </div>.
   // Let's look at the return statement structure.
}
