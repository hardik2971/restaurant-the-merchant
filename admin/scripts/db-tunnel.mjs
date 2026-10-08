// SSH tunnel to the remote MySQL, for running the admin on a dev PC.
//   127.0.0.1:DB_TUNNEL_PORT  →  (ssh SSH_USER@SSH_HOST)  →  DB_REMOTE_HOST:DB_REMOTE_PORT
// Settings come from admin/.env. Use `npm run tunnel` on its own (Prisma CLI,
// db:push, studio), or `npm run start:local`, which opens it before the server.
// Not needed on the server itself, where MySQL is local.
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

export function openTunnel({ quiet = false } = {}) {
  const {
    SSH_HOST,
    SSH_PORT = '22',
    SSH_USER = 'root',
    SSH_PASSWORD,
    DB_TUNNEL_PORT = '33663',
    DB_REMOTE_HOST = '127.0.0.1',
    DB_REMOTE_PORT = '3306',
  } = process.env;
  if (!SSH_HOST || !SSH_PASSWORD) {
    return Promise.reject(new Error('SSH_HOST / SSH_PASSWORD missing in admin/.env'));
  }
  const log = (...a) => !quiet && console.log('[tunnel]', ...a);

  return new Promise((resolve, reject) => {
    const ssh = new Client();
    let server;
    ssh
      .on('ready', () => {
        server = net
          .createServer((sock) => {
            ssh.forwardOut('127.0.0.1', sock.remotePort ?? 0, DB_REMOTE_HOST, Number(DB_REMOTE_PORT), (err, stream) => {
              if (err) return sock.destroy();
              sock.pipe(stream).pipe(sock);
              stream.on('error', () => sock.destroy());
              sock.on('error', () => stream.destroy());
            });
          })
          .on('error', reject)
          .listen(Number(DB_TUNNEL_PORT), '127.0.0.1', () => {
            log(`127.0.0.1:${DB_TUNNEL_PORT} → ${SSH_HOST} → ${DB_REMOTE_HOST}:${DB_REMOTE_PORT}`);
            resolve({ close: () => (server.close(), ssh.end()) });
          });
      })
      .on('error', (e) => reject(new Error(`SSH connection failed: ${e.message}`)))
      .on('close', () => {
        log('SSH connection closed');
        server?.close();
        process.exitCode = 1;
      })
      .connect({
        host: SSH_HOST,
        port: Number(SSH_PORT),
        username: SSH_USER,
        password: SSH_PASSWORD,
        keepaliveInterval: 15000,
        readyTimeout: 20000,
      });
  });
}

// `node scripts/db-tunnel.mjs` → run until Ctrl+C.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.loadEnvFile(new URL('../.env', import.meta.url));
  openTunnel().catch((e) => {
    console.error('[tunnel]', e.message);
    process.exit(1);
  });
}
