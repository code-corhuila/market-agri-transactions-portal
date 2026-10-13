import { readFileSync } from 'node:fs';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { EXPOSES, PUBLIC_BASE, REMOTE_NAME, sharedSingletons } from './config/federation';

const PORT = 5176;
const { dependencies } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { dependencies: Record<string, string> };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    base: PUBLIC_BASE,
    plugins: [
      react(),
      // A remote of the container (ADR-021): exposes ./App and takes the shell from it.
      federation({
        name: REMOTE_NAME,
        filename: 'remoteEntry.js',
        exposes: EXPOSES,
        remotes: {
          shell: {
            type: 'module',
            name: 'shell',
            entry: env.VITE_SHELL_URL || 'http://localhost:5173/remoteEntry.js', // dev: the container's server
          },
        },
        shared: sharedSingletons(dependencies),
        shareStrategy: 'loaded-first',
        dts: false,
      }),
    ],
    server: { port: PORT, strictPort: true, origin: `http://localhost:${PORT}` },
    preview: { port: PORT, strictPort: true },
    build: { target: 'esnext' },
  };
});
