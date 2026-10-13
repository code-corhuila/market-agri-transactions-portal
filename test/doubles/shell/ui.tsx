import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// Doubles of the container's design system (shell/ui): the same markup that matters to the tests
// (headings, text), none of its styles. The real components are tested in market-agri-front.

export function PageHeader({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function EmptyState(props: { icon: LucideIcon; title: ReactNode; description?: ReactNode }) {
  return (
    <div>
      <h2>{props.title}</h2>
      {props.description && <p>{props.description}</p>}
    </div>
  );
}
