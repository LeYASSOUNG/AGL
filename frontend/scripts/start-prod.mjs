import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = process.env.PORT || '4173';
const serveMain = path.join(root, 'node_modules', 'serve', 'build', 'main.js');

const child = spawn(
  process.execPath,
  [serveMain, '-s', 'dist', '--listen', `tcp://0.0.0.0:${port}`],
  { cwd: root, stdio: 'inherit' },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
