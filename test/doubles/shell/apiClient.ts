// Double of the container's HTTP client (shell/apiClient). Every test stubs what it needs with
// vi.spyOn(apiClient, 'post'); an unstubbed call fails, so no test reaches a network by accident.
const notStubbed = (): Promise<never> => Promise.reject(new Error('apiClient call not stubbed'));

export const apiClient = {
  get: notStubbed as <T>(path: string, options?: unknown) => Promise<T>,
  post: notStubbed as <T>(path: string, body: unknown, options?: unknown) => Promise<T>,
  put: notStubbed as <T>(path: string, body: unknown, options?: unknown) => Promise<T>,
  patch: notStubbed as <T>(path: string, body: unknown, options?: unknown) => Promise<T>,
  delete: notStubbed as <T>(path: string, options?: unknown) => Promise<T>,
};

/** The shape of the container's ApiError (api-contract §2 plus the status). */
export function apiError(
  status: number,
  error: string,
  message: string,
  details: { field: string; message: string }[] = [],
) {
  return Object.assign(new Error(message), {
    name: 'ApiError',
    status,
    error,
    details,
    traceId: 't-1',
  });
}
