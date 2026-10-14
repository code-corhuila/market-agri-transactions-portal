import { useSyncExternalStore } from 'react';
import { getSession, subscribe, type Session } from './session';

// Double of shell/useSession, over the session double.
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession);
}
