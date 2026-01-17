// Test setup for daemon
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = ':memory:';
});

afterAll(() => {
  // Cleanup
});
