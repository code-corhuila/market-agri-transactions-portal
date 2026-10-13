import { readFileSync } from 'node:fs';
import viteConfig from '../../vite.config';
import { PUBLIC_BASE, REMOTE_NAME } from '../../config/federation';

// ADR-017: the gateway serves this portal under /portals/<name>/, in the same origin as the
// container, and strips the prefix. The portal is built for that path, takes the shell from the
// container's own remoteEntry.js and is included by market-agri-infra without a port.
const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('the portal behind the gateway (ADR-017)', () => {
  it('is built for /portals/<its name>/, so its chunks are asked for under that prefix', async () => {
    expect(PUBLIC_BASE).toBe(`/portals/${REMOTE_NAME}/`);
    const config = await (viteConfig as (env: object) => { base?: string })({
      command: 'build',
      mode: 'production',
    });
    expect(config.base).toBe(PUBLIC_BASE);
  });

  it('cannot build its image without the address of the shell (R-24)', () => {
    const dockerfile = read('deploy/Dockerfile');
    expect(dockerfile).toMatch(/^ARG VITE_SHELL_URL$/m);
    expect(dockerfile).toContain('${VITE_SHELL_URL:?');
  });

  it('never caches remoteEntry.js and, on one origin, answers no CORS', () => {
    const nginx = read('deploy/nginx.conf');
    expect(nginx).toMatch(/remoteEntry\\\.js\|mf-manifest\\\.json[\s\S]*Cache-Control "no-store"/);
    expect(nginx).not.toContain('Access-Control-Allow-Origin');
  });

  it('is a service of the platform with the shell of the same origin and no port of its own', () => {
    const compose = read('deploy/compose.yml');
    expect(compose).toMatch(new RegExp(`^  ${REMOTE_NAME}-portal:$`, 'm'));
    expect(compose).toMatch(/VITE_SHELL_URL: \/remoteEntry\.js$/m);
    expect(compose).toContain("expose: ['80']");
    expect(compose).not.toMatch(/^\s+ports:/m);
    expect(compose).toContain('name: platform-${ENV:?set ENV}');
  });
});
