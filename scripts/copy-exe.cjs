const { cpSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

const src = 'dist-desktop/Nour-1.0.0-portable.exe';
const dest = 'public/downloads/Nour-1.0.0-portable.exe';

if (!existsSync(src)) {
  console.log('⚠️  Exe introuvable. Lance d\'abord : npm run desktop:build');
  process.exit(1);
}

mkdirSync(path.dirname(dest), { recursive: true });
cpSync(src, dest);
console.log('✅ .exe copié dans public/downloads/');