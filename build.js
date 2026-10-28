import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      if (item === 'node_modules' || item === 'dist' || item === '.git' || item === '.aistudio' || item === 'public') continue;
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 1. Build dist/
fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

const itemsToCopy = [
  'index.html',
  'style.css',
  'config.js',
  'tracker.js',
  'favicon.svg',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'vercel.json',
  'img',
  'servicos',
  'bairros',
  'sobre',
  'perguntas-frequentes',
  'politica-de-privacidade'
];

for (const item of itemsToCopy) {
  copyRecursive(path.join(__dirname, item), path.join(__dirname, 'dist', item));
}

// 2. Also ensure public/ has all assets if Vercel defaults to 'public' folder
const publicDir = path.join(__dirname, 'public');
fs.mkdirSync(publicDir, { recursive: true });

for (const item of itemsToCopy) {
  copyRecursive(path.join(__dirname, item), path.join(publicDir, item));
}

console.log('Build completed successfully: all 13 pages, images, and configs ready in dist/ and public/ for Vercel.');
