import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- DEBUG INFO ---');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Files in current directory:', fs.readdirSync('.'));
try {
  console.log('Files in electron/:', fs.readdirSync(path.join(__dirname, 'electron')));
} catch (e) {
  console.log('Error reading electron/ directory:', e.message);
}
console.log('------------------');

try {
  console.log('Building client...');
  execSync('vite build', { stdio: 'inherit' });

  console.log('Building electron main...');
  const mainPath = path.resolve(__dirname, 'electron', 'main.js');
  console.log('Attempting to build main at:', mainPath);
  execSync(`esbuild ${mainPath} --bundle --platform=node --external:electron --format=cjs --outfile=dist-electron/main.js`, { stdio: 'inherit' });

  console.log('Building electron preload...');
  const preloadPath = path.resolve(__dirname, 'electron', 'preload.js');
  console.log('Attempting to build preload at:', preloadPath);
  execSync(`esbuild ${preloadPath} --bundle --platform=node --external:electron --format=cjs --outfile=dist-electron/preload.js`, { stdio: 'inherit' });

  console.log('Running electron-builder...');
  execSync('electron-builder', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
