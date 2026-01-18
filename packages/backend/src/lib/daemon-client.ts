import net from 'net';
import path from 'path';
import os from 'os';

const SOCKET_PATH = path.join(os.homedir(), '.habit-tracker', 'daemon.sock');
const TIMEOUT_MS = 1000;

export async function notifyDaemon(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.write('refresh\n');
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.on('data', (data) => {
      const response = data.toString().trim();
      socket.end();
      resolve(response === 'ok');
    });

    socket.on('error', () => {
      // Daemon not running or socket unavailable - fail silently
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

export async function pingDaemon(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.write('ping\n');
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.on('data', (data) => {
      socket.end();
      resolve(data.toString().trim() === 'pong');
    });

    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}
