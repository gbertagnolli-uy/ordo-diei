const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/Header.tsx', 'utf8');

content = content.replace('import { useEffect, useState } from "react";', 'import { useEffect, useState, useRef } from "react";');

fs.writeFileSync('src/components/dashboard/Header.tsx', content);
