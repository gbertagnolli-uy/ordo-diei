const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/Header.tsx', 'utf8');

// Add level ref to track previous level
const hookCode = `  const prevLevelRef = useRef(0);

  useEffect(() => {
    if (currentUser?.puntosAcumulados !== undefined) {
      const currentLevel = getLevelInfo(currentUser.puntosAcumulados).level;

      if (prevLevelRef.current !== 0 && currentLevel > prevLevelRef.current) {
        // Level up!
        const { title } = getLevelInfo(currentUser.puntosAcumulados);
        openModal("LEVEL_UP", { level: currentLevel, title });
      }

      prevLevelRef.current = currentLevel;
    }
  }, [currentUser?.puntosAcumulados, openModal]);

  const handleLogout = async () => {`;

content = content.replace('  const handleLogout = async () => {', hookCode);

// Add useRef import if missing
if (!content.includes('useRef')) {
  content = content.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect, useRef } from "react";');
}

fs.writeFileSync('src/components/dashboard/Header.tsx', content);
