import type { LucideIcon } from 'lucide-react';
import { cloneElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

// Doubles of the container's design system (shell/ui): the same markup that matters to the tests
// (headings, text), none of its styles. The real components are tested in market-agri-front.

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {actions}
    </div>
  );
}

export function EmptyState(props: {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div>
      <h2>{props.title}</h2>
      {props.description && <p>{props.description}</p>}
      {props.action}
    </div>
  );
}

// Card, Badge, Skeleton, LoadingBlock, Alert, Button and Breadcrumbs keep what the tests read: the
// element, the text, the variant (data-variant), the loading announcement, the alert role and links.
export function Card({ as: Tag = 'div', children }: { as?: 'div' | 'li'; children: ReactNode }) {
  return <Tag>{children}</Tag>;
}

export function Badge({ variant, children }: { variant?: string; children: ReactNode }) {
  return <span data-variant={variant}>{children}</span>;
}

export const Skeleton = {
  Grid: (_props: { count?: number; withThumb?: boolean }) => <span role="status">Cargando…</span>,
};

export function LoadingBlock({ label = 'Cargando…' }: { label?: string }) {
  return <span role="status">{label}</span>;
}

export function Alert({ variant = 'info', children }: { variant?: string; children: ReactNode }) {
  return (
    <div role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}>{children}</div>
  );
}

export function Button({
  variant: _variant,
  loading,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; loading?: boolean }) {
  return <button {...rest} disabled={rest.disabled || loading} />;
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactElement<{ id?: string }>;
}) {
  const id = `field-${label}`;
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id, 'aria-invalid': error ? true : undefined } as Record<
        string,
        unknown
      >)}
      {error ? <p>{error}</p> : hint && <p>{hint}</p>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Ruta de navegación">
      {items.map((item) =>
        item.to ? (
          <Link key={item.label} to={item.to}>
            {item.label}
          </Link>
        ) : (
          <span key={item.label}>{item.label}</span>
        ),
      )}
    </nav>
  );
}
