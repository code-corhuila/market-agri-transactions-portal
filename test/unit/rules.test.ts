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

  // Structural, not one spelling of it (review of the structure PR): the code of the portal reads
  // no build-time configuration and holds no absolute URL, so it cannot know any address. The one
  // address it needs, the container's remoteEntry, lives in vite.config.ts.
  it('never knows an address: no import.meta.env and no absolute URL in src', () => {
    const offenders = sources(SRC).filter((file) =>
      /import\.meta\.env|https?:\/\//.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
