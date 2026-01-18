import net from 'net';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { log } from './hosts-manager';

const DEFAULT_SOCKET_PATH = path.join(os.homedir(), '.habit-tracker', 'daemon.sock');

export interface SocketServerOptions {
  onRefresh: () => Promise<void>;
  onReset: () => Promise<void>;
  socketPath?: string; // For testing
}

export function startSocketServer(options: SocketServerOptions): net.Server {
  const { onRefresh, onReset, socketPath = DEFAULT_SOCKET_PATH } = options;

  // Clean up stale socket file if exists
  if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
  }

  const server = net.createServer((socket) => {
    socket.on('data', async (data) => {
      const message = data.toString().trim();

      if (message === 'refresh') {
        log('Received refresh signal via socket');
        await onRefresh();
        socket.write('ok\n');
      } else if (message === 'reset') {
        log('Received reset signal via socket');
        try {
          await onReset();
          socket.write('ok\n');
        } catch (error) {
          log(`Reset failed: ${error}`, 'error');
          socket.write('error: reset failed\n');
        }
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

  server.listen(socketPath, () => {
    log(`Socket server listening on ${socketPath}`);
    // Set permissions so backend can connect
    fs.chmodSync(socketPath, 0o660);
  });

  return server;
}

export function stopSocketServer(server: net.Server, socketPath = DEFAULT_SOCKET_PATH): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      if (fs.existsSync(socketPath)) {
        fs.unlinkSync(socketPath);
      }
      resolve();
    });
  });
}
