// Double of the container's session (shell/session): the same contract in memory. Like the real
// one, setSession keeps only accessToken, expiresAt and user (the refreshToken is dropped).
type Role = 'PRODUCER' | 'BUYER' | 'ADMIN';
export interface Session {
  accessToken: string;
  expiresAt: string;
  user: { id: string; name: string; email: string; role: Role };
}

let current: Session | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function getSession(): Session | null {
  return current;
}

export function setSession({ accessToken, expiresAt, user }: Session): void {
  current = { accessToken, expiresAt, user };
  notify();
}

export function clearSession(): void {
  current = null;
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
