import net from 'net';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { startSocketServer, stopSocketServer } from './socket-server';

// Mock hosts-manager but NOT fs - we need real filesystem for socket
jest.mock('./hosts-manager', () => ({
  log: jest.fn(),
}));

describe('Socket Server', () => {
  // Use a unique test socket path to avoid conflicts with real daemon
  const TEST_SOCKET_PATH = path.join(os.tmpdir(), `daemon-test-${process.pid}.sock`);
  let server: net.Server;
  let mockOnRefresh: jest.Mock;
  let mockOnReset: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnRefresh = jest.fn().mockResolvedValue(undefined);
    mockOnReset = jest.fn().mockResolvedValue(undefined);
    // Clean up any stale socket file
    if (fs.existsSync(TEST_SOCKET_PATH)) {
      fs.unlinkSync(TEST_SOCKET_PATH);
    }
  });

  afterEach(async () => {
    if (server) {
      await stopSocketServer(server, TEST_SOCKET_PATH);
    }
    // Clean up socket file
    if (fs.existsSync(TEST_SOCKET_PATH)) {
      fs.unlinkSync(TEST_SOCKET_PATH);
    }
  });

  describe('reset command', () => {
    it('handles reset command and calls onReset callback', (done) => {
      server = startSocketServer({ onRefresh: mockOnRefresh, onReset: mockOnReset, socketPath: TEST_SOCKET_PATH });

      server.once('listening', () => {
        const client = net.createConnection(TEST_SOCKET_PATH, () => {
          client.write('reset\n');
        });

        client.on('data', (data) => {
          expect(data.toString()).toBe('ok\n');
          expect(mockOnReset).toHaveBeenCalledTimes(1);
          expect(mockOnRefresh).not.toHaveBeenCalled();
          client.end();
          done();
        });
      });
    });

    it('handles reset failure and returns error', (done) => {
      mockOnReset.mockRejectedValue(new Error('Reset failed'));
      server = startSocketServer({ onRefresh: mockOnRefresh, onReset: mockOnReset, socketPath: TEST_SOCKET_PATH });

      server.once('listening', () => {
        const client = net.createConnection(TEST_SOCKET_PATH, () => {
          client.write('reset\n');
        });

        client.on('data', (data) => {
          expect(data.toString()).toBe('error: reset failed\n');
          expect(mockOnReset).toHaveBeenCalledTimes(1);
          client.end();
          done();
        });
      });
    });
  });

  describe('refresh command', () => {
    it('handles refresh command and calls onRefresh callback', (done) => {
      server = startSocketServer({ onRefresh: mockOnRefresh, onReset: mockOnReset, socketPath: TEST_SOCKET_PATH });

      server.once('listening', () => {
        const client = net.createConnection(TEST_SOCKET_PATH, () => {
          client.write('refresh\n');
        });

        client.on('data', (data) => {
          expect(data.toString()).toBe('ok\n');
          expect(mockOnRefresh).toHaveBeenCalledTimes(1);
          expect(mockOnReset).not.toHaveBeenCalled();
          client.end();
          done();
        });
      });
    });
  });

  describe('ping command', () => {
    it('responds with pong', (done) => {
      server = startSocketServer({ onRefresh: mockOnRefresh, onReset: mockOnReset, socketPath: TEST_SOCKET_PATH });

      server.once('listening', () => {
        const client = net.createConnection(TEST_SOCKET_PATH, () => {
          client.write('ping\n');
        });

        client.on('data', (data) => {
          expect(data.toString()).toBe('pong\n');
          client.end();
          done();
        });
      });
    });
  });

  describe('unknown command', () => {
    it('returns error for unknown command', (done) => {
      server = startSocketServer({ onRefresh: mockOnRefresh, onReset: mockOnReset, socketPath: TEST_SOCKET_PATH });

      server.once('listening', () => {
        const client = net.createConnection(TEST_SOCKET_PATH, () => {
          client.write('unknown\n');
        });

        client.on('data', (data) => {
          expect(data.toString()).toBe('error: unknown command\n');
          client.end();
          done();
        });
      });
    });
  });
});
