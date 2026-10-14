/** The contract with the container (ADR-021): remote name and the module it mounts. */
export const REMOTE_NAME = 'transactions';
export const EXPOSES = { './App': './src/App.tsx' };

/**
 * Where the gateway serves this portal, in the container's origin (ADR-017). It strips the prefix,
 * and the portal is built with it as its public base, so its chunks are asked for under it.
 */
export const PUBLIC_BASE = `/portals/${REMOTE_NAME}/`;

/** Libraries this portal takes from the container as one copy (ADR-021, Annex H). */
export const SINGLETONS = ['react', 'react-dom', 'react-router-dom'] as const;

/**
 * Module Federation `shared` for the singletons, the same the container declares
 * (market-agri-front config/federation.ts): one copy, and the range of package.json strictly, so
 * a version the container does not provide is reported by this portal's name.
 */
export function sharedSingletons(dependencies: Record<string, string | undefined>) {
  return Object.fromEntries(
    SINGLETONS.map((library) => {
      const requiredVersion = dependencies[library];
      if (!requiredVersion) {
        throw new Error(`${library} is shared with the container but is not in package.json`);
      }
      return [library, { singleton: true, requiredVersion, strictVersion: true }];
    }),
  );
}
