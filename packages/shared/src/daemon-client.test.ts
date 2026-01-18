import net from 'net';
import { notifyDaemon, pingDaemon, resetHosts } from './daemon-client';

// Mock the net module
jest.mock('net');

const mockNet = net as jest.Mocked<typeof net>;

describe('Daemon Client', () => {
  let mockSocket: {
    write: jest.Mock;
    end: jest.Mock;
    destroy: jest.Mock;
    setTimeout: jest.Mock;
    on: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = {
      write: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
      setTimeout: jest.fn(),
      on: jest.fn(),
    };
    mockNet.createConnection.mockReturnValue(mockSocket as unknown as net.Socket);
  });

  describe('resetHosts', () => {
    it('returns true on successful reset', async () => {
      // Set up socket event handlers
      mockSocket.on.mockImplementation((event: string, handler: (data?: Buffer) => void) => {
        if (event === 'data') {
          // Simulate successful response
          setTimeout(() => handler(Buffer.from('ok\n')), 0);
        }
        return mockSocket;
      });

      // Simulate successful connection
      mockNet.createConnection.mockImplementation((_path: string, callback?: () => void) => {
        if (callback) setTimeout(callback, 0);
        return mockSocket as unknown as net.Socket;
      });

      const result = await resetHosts();

      expect(result).toBe(true);
      expect(mockSocket.write).toHaveBeenCalledWith('reset\n');
    });

    it('returns false when daemon is not running', async () => {
      mockSocket.on.mockImplementation((event: string, handler: (err?: Error) => void) => {
        if (event === 'error') {
          setTimeout(() => handler(new Error('ECONNREFUSED')), 0);
        }
        return mockSocket;
      });

      mockNet.createConnection.mockReturnValue(mockSocket as unknown as net.Socket);

      const result = await resetHosts();

      expect(result).toBe(false);
    });

    it('returns false on timeout', async () => {
      mockSocket.on.mockImplementation((event: string, handler: () => void) => {
        if (event === 'timeout') {
          setTimeout(handler, 0);
        }
        return mockSocket;
      });

      mockNet.createConnection.mockReturnValue(mockSocket as unknown as net.Socket);

      const result = await resetHosts();

      expect(result).toBe(false);
      expect(mockSocket.destroy).toHaveBeenCalled();
    });

    it('returns false when reset fails', async () => {
      mockSocket.on.mockImplementation((event: string, handler: (data?: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => handler(Buffer.from('error: reset failed\n')), 0);
        }
        return mockSocket;
      });

      mockNet.createConnection.mockImplementation((_path: string, callback?: () => void) => {
        if (callback) setTimeout(callback, 0);
        return mockSocket as unknown as net.Socket;
      });

      const result = await resetHosts();

      expect(result).toBe(false);
    });
  });

  describe('notifyDaemon', () => {
    it('returns true on successful refresh', async () => {
      mockSocket.on.mockImplementation((event: string, handler: (data?: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => handler(Buffer.from('ok\n')), 0);
        }
        return mockSocket;
      });

      mockNet.createConnection.mockImplementation((_path: string, callback?: () => void) => {
        if (callback) setTimeout(callback, 0);
        return mockSocket as unknown as net.Socket;
      });

      const result = await notifyDaemon();

      expect(result).toBe(true);
      expect(mockSocket.write).toHaveBeenCalledWith('refresh\n');
    });
  });

  describe('pingDaemon', () => {
    it('returns true on successful ping', async () => {
      mockSocket.on.mockImplementation((event: string, handler: (data?: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => handler(Buffer.from('pong\n')), 0);
        }
        return mockSocket;
      });

      mockNet.createConnection.mockImplementation((_path: string, callback?: () => void) => {
        if (callback) setTimeout(callback, 0);
        return mockSocket as unknown as net.Socket;
      });

      const result = await pingDaemon();

      expect(result).toBe(true);
      expect(mockSocket.write).toHaveBeenCalledWith('ping\n');
    });
  });
});
