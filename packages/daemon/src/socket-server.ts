import net from 'net';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { log } from './hosts-manager';

const SOCKET_PATH = path.join(os.homedir(), '.habit-tracker', 'daemon.sock');

export function startSocketServer(onRefresh: () => Promise<void>): net.Server {
  // Clean up stale socket file if exists
  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
  }

  const server = net.createServer((socket) => {
    socket.on('data', async (data) => {
      const message = data.toString().trim();

      if (message === 'refresh') {
        log('Received refresh signal via socket');
        await onRefresh();
        socket.write('ok\n');
      } else if (message === 'ping') {
        socket.write('pong\n');
      } else {
        socket.write('error: unknown command\n');
      }
      socket.end();
    });

    socket.on('error', (err) => {
      log(`Socket client error: ${err.message}`, 'error');
    });
  });

  server.listen(SOCKET_PATH, () => {
    log(`Socket server listening on ${SOCKET_PATH}`);
    // Set permissions so backend can connect
    fs.chmodSync(SOCKET_PATH, 0o660);
  });

  return server;
}

export function stopSocketServer(server: net.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      if (fs.existsSync(SOCKET_PATH)) {
        fs.unlinkSync(SOCKET_PATH);
      }
      resolve();
    });
  });
}
