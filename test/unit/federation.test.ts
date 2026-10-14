import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { EXPOSES, REMOTE_NAME, SINGLETONS, sharedSingletons } from '../../config/federation';

// The contract with the container (ADR-021): the remote name and ./App; and the same singletons,
// strictly in the version range of package.json, that the container declares.
const root = new URL('../../', import.meta.url);
const { dependencies } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as {
  dependencies: Record<string, string>;
};

describe('federation of the transactions portal', () => {
  it('is the remote "transactions" and exposes ./App, a file that exists', () => {
    expect(REMOTE_NAME).toBe('transactions');
    expect(Object.keys(EXPOSES)).toEqual(['./App']);
    expect(existsSync(fileURLToPath(new URL(EXPOSES['./App'], root)))).toBe(true);
  });

  it('shares React, React DOM and the router as single copies, strictly in its versions', () => {
    expect([...SINGLETONS]).toEqual(['react', 'react-dom', 'react-router-dom']);
    for (const name of SINGLETONS) {
      expect(sharedSingletons(dependencies)[name]).toEqual({
        singleton: true,
        requiredVersion: dependencies[name],
        strictVersion: true,
      });
    }
  });

  it('fails the build when a shared library is not a dependency', () => {
    expect(() => sharedSingletons({ react: '^19.2.0' })).toThrow(
      'react-dom is shared with the container but is not in package.json',
    );
  });
});
