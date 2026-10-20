import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 25000,
    hookTimeout: 25000,
    fileParallelism: false, // Run test files serially to prevent database concurrency collisions
    globalSetup: ['./tests/setup/globalSetup.js'],
    setupFiles: ['./tests/setup/testDb.js'],
  },
});
