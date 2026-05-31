import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  console.log('Building client...');
  execSync('vite build', { stdio: 'inherit' });

  console.log('Building electron main...');
  const mainPath = path.join(__dirname, 'electron', 'main.js');
  execSync(`esbuild ${mainPath} --bundle --platform=node --external:electron --format=cjs --outfile=dist-electron/main.js`, { stdio: 'inherit' });

  console.log('Building electron preload...');
  const preloadPath = path.join(__dirname, 'electron', 'preload.js');
  execSync(`esbuild ${preloadPath} --bundle --platform=node --external:electron --format=cjs --outfile=dist-electron/preload.js`, { stdio: 'inherit' });

  console.log('Running electron-builder...');
  execSync('electron-builder', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
