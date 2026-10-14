// What the container (market-agri-front) exposes through Module Federation (ADR-021, Annex H):
// shell/apiClient, shell/session, shell/useSession, shell/RequireAuth and shell/ui. A portal never
// has its own HTTP client, session or design system. Only what the portal uses is declared here,
// mirroring the container's code (src/core, src/shared/ui); each page adds what it needs.

declare module 'shell/ui' {
  import type { ReactNode } from 'react';
  import type { LucideIcon } from 'lucide-react';

  export function PageHeader(props: {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
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
