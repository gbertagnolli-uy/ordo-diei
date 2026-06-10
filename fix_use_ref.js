const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/Header.tsx', 'utf8');

if (!content.includes('import { useState, useEffect, useRef }')) {
  content = content.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect, useRef } from "react";');
}

fs.writeFileSync('src/components/dashboard/Header.tsx', content);

let modalContent = fs.readFileSync('src/components/dashboard/ModalManager.tsx', 'utf8');

if (!modalContent.includes('import { getLevelInfo }')) {
  modalContent = modalContent.replace('import { useAuthStore } from "@/store/authStore";', 'import { useAuthStore } from "@/store/authStore";\nimport { getLevelInfo } from "@/lib/levelUtils";');
}
fs.writeFileSync('src/components/dashboard/ModalManager.tsx', modalContent);
