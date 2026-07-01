const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/ModalManager.tsx', 'utf8');
content = content.replace(
  `import { LeaderboardModal } from "./LeaderboardModal";
import confetti from "canvas-confetti";
import { getLevelInfo } from "@/lib/levelUtils";
import { MoodSelector } from "./MoodSelector";`,
  `import { LeaderboardModal } from "./LeaderboardModal";
import confetti from "canvas-confetti";
import { MoodSelector } from "./MoodSelector";`
);

fs.writeFileSync('src/components/dashboard/ModalManager.tsx', content);
