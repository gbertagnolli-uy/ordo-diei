const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/NoticeBar.tsx', 'utf8');
content = content.replace(
  `  if (messageType === "happyhour") {
    return (
      <div className="fixed top-0 left-0 w-full z-[100] bg-[color-mix(in-srgb,var(--primary)_20%,transparent)] text-[var(--primary)] p-2 font-headline font-bold text-center elevation-ambient shadow-md border-b border-[var(--primary)] animate-pulse">
        🎉 ¡Happy Hour! Completa tareas ahora y obtén +50% de puntos extra.
      </div>
    );
  }`,
  ``
);

fs.writeFileSync('src/components/dashboard/NoticeBar.tsx', content);
