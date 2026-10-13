import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Annex H, "La regla que implementan los dos": the HTTP client and the session live in the
// container. A portal asks shell/apiClient for relative paths (/api/v1/...), never calls fetch
// and never knows where the gateway is.
const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

describe('portal rules (Annex H)', () => {
  it('has its source code in src/', () => {
    expect(existsSync(SRC) && sources(SRC).length).toBeTruthy();
  });

  it('never calls fetch: every request goes through shell/apiClient', () => {
    const offenders = sources(SRC).filter((file) =>
      /\bfetch\s*\(/.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('never knows the gateway: no gateway variable, no absolute API URL', () => {
    const offenders = sources(SRC).filter((file) =>
      /VITE_GATEWAY_URL|https?:\/\/[^'"`\s]*\/api\//.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
