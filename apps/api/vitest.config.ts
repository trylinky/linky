import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Integration tests share the dev database; keep files serial.
    fileParallelism: false,
    // Fails any test loudly if it makes a real fetch call instead of hitting
    // a mocked boundary — see the comment in vitest.setup.ts for why this is
    // global rather than per-file.
    setupFiles: ['./src/vitest.setup.ts'],
  },
});
