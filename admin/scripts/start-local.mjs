// Dev-PC launcher: opens the DB tunnel, then runs the built admin (next start
// on 33664) against it. Usage: `npm run build` once, then `npm run start:local`.
import { spawn } from 'node:child_process';
import { openTunnel } from './db-tunnel.mjs';

process.loadEnvFile(new URL('../.env', import.meta.url));

try {
  await openTunnel();
} catch (e) {
  console.error('[start:local]', e.message);
  process.exit(1);
}

const next = spawn('npx', ['next', 'start', '-p', '33664'], { stdio: 'inherit', shell: true });
next.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => next.kill(sig));
