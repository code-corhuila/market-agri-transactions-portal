import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from 'shell/apiClient';

export type Remote<T> =
  { state: 'loading' } | { state: 'error'; error: ApiError } | { state: 'data'; data: T };

/**
 * Loading, error and data of one request (Annex H, the view states). A new key cancels the request
 * it replaces; `reload` asks again, keeping the data on screen while the answer arrives.
 */
export function useRemote<T>(load: (signal: AbortSignal) => Promise<T>, key: string) {
  const [remote, setRemote] = useState<Remote<T>>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setRemote((current) => (current.state === 'data' ? current : { state: 'loading' }));
    load(controller.signal).then(
      (data) => {
        // A replaced request never wins, even if the client resolves it instead of rejecting it.
        if (!controller.signal.aborted) setRemote({ state: 'data', data });
      },
      (error: ApiError) => {
        if (!controller.signal.aborted) setRemote({ state: 'error', error });
      },
    );
    return () => controller.abort();
    // `load` is rebuilt on every render: the key (and a reload) decide when to ask again.
  }, [key, attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  return { remote, reload };
}
