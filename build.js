// Copia o site estático para a pasta dist. Usa só recursos nativos do Node.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(raiz, 'dist');
const ignorar = new Set(['node_modules', 'dist', '.git', '.aistudio', 'src', 'public', 'apps-script',
  'package.json', 'package-lock.json', 'build.js', 'vite.config.ts', 'tsconfig.json', 'metadata.json',
  'LEIA-ME.txt', 'vercel.json', '.gitignore', '.env', '.env.example']);

function copiar(origem, destino) {
  const st = fs.statSync(origem);
  if (st.isDirectory()) {
    fs.mkdirSync(destino, { recursive: true });
    for (const item of fs.readdirSync(origem)) copiar(path.join(origem, item), path.join(destino, item));
  } else {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(origem, destino);
  }
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const item of fs.readdirSync(raiz)) {
  if (ignorar.has(item)) continue;
  copiar(path.join(raiz, item), path.join(dist, item));
}
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('ERRO: index.html não encontrado na raiz do projeto.');
  process.exit(1);
}
console.log('Build concluído. Arquivos em dist/.');
