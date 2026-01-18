// Test setup file
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';

  // Mock console warnings in tests
  global.console = {
    ...console,
    warn: vi.fn(),
  };
});

afterAll(() => {
  // Cleanup after all tests
});
