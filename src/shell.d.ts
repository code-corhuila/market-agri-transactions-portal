// What the container (market-agri-front) exposes through Module Federation (ADR-021, Annex H):
// shell/apiClient, shell/session, shell/useSession, shell/RequireAuth and shell/ui. A portal never
// has its own HTTP client, session or design system. Only what the portal uses is declared here,
// mirroring the container's code (src/core, src/shared/ui); each page adds what it needs.

declare module 'shell/ui' {
  import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from 'react';
  import type { LucideIcon } from 'lucide-react';

  export function PageHeader(props: {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    className?: string;
  }): ReactNode;
  export function Card(
    props: HTMLAttributes<HTMLElement> & {
      as?: 'div' | 'li' | 'article' | 'section';
      interactive?: boolean;
      padding?: 'none' | 'sm' | 'md';
    },
  ): ReactNode;
  export function Badge(props: {
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    children: ReactNode;
    className?: string;
  }): ReactNode;
  export function LoadingBlock(props: { label?: string }): ReactNode;
  export function Alert(props: {
    variant?: 'error' | 'warning' | 'info' | 'success';
    children: ReactNode;
    hideIcon?: boolean;
    className?: string;
  }): ReactNode;
  export function Button(
    props: ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
      size?: 'sm' | 'md';
      block?: boolean;
      loading?: boolean;
    },
  ): ReactNode;
  export function Field(props: {
    label: string;
    hint?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    children: ReactElement;
    className?: string;
  }): ReactNode;
  export function EmptyState(props: {
    icon: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
  }): ReactNode;
}

declare module 'shell/apiClient' {
  export interface RequestOptions {
    signal?: AbortSignal;
    idempotencyKey?: string;
  }
  /** What every failure rejects with: the error body of api-contract §2 plus the status. */
  export interface ApiError extends Error {
    readonly status: number;
    readonly error: string;
    readonly details: { field: string; message: string }[];
    readonly traceId: string;
  }
  export const apiClient: {
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;
    put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;
    patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;
    delete<T>(path: string, options?: RequestOptions): Promise<T>;
  };
}

declare module 'shell/session' {
  export type Role = 'PRODUCER' | 'BUYER' | 'ADMIN';
  export interface Session {
    accessToken: string;
    expiresAt: string;
    user: { id: string; name: string; email: string; role: Role };
  }
  export function getSession(): Session | null;
  export function setSession(session: Session): void;
  export function clearSession(): void;
}

declare module 'shell/useSession' {
  import type { Session } from 'shell/session';
  export function useSession(): Session | null;
}
