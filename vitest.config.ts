import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit and component levels (testing-strategy.md), job `ci`. The container's modules (shell/*)
// exist only at runtime, through Module Federation: in the tests, doubles stand in for them.
const doubles = fileURLToPath(new URL('./test/doubles/shell/', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: [{ find: /^shell\/(.+)$/, replacement: `${doubles}$1` }] },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: { name: 'unit', environment: 'node', include: ['test/unit/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['test/component/**/*.test.tsx'],
          setupFiles: ['./test/component/setup.ts'],
        },
      },
    ],
  },
});
