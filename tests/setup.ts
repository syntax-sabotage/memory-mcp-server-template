/**
 * Jest test setup configuration
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.VPS_MEMORY_BASE_URL = 'http://localhost:8080';
process.env.VPS_MEMORY_API_KEY = 'test-api-key';
process.env.VPS_MEMORY_TIMEOUT = '5000';
process.env.VPS_MEMORY_RETRY_ATTEMPTS = '2';
process.env.VPS_MEMORY_RETRY_DELAY = '100';

// Console suppression during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Global test utilities
global.mockFetch = (response: any, ok: boolean = true, status: number = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    json: jest.fn().mockResolvedValue(response)
  });
};

// Restore console after all tests
afterAll(() => {
  global.console = originalConsole;
});