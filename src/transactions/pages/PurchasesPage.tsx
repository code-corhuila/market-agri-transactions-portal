import { Receipt } from 'lucide-react';
import { EmptyState, PageHeader } from 'shell/ui';

/** Main page of the portal; its content arrives with the sub-tasks of the domain. */
export function PurchasesPage() {
  return (
    <section className="stack">
      <PageHeader title="Mis compras" />
      <EmptyState
        icon={Receipt}
        title="En construcción"
        description="Pronto podrá ver aquí sus compras y el estado de cada una."
      />
    </section>
  );
}
