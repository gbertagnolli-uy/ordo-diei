const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/Header.tsx', 'utf8');

// The issue was we were missing `openModal` from destructuring inside the hook.
// Let's verify we have it.
if (content.includes('const { openModal } = useModalStore();')) {
   console.log('openModal is already present');
}
