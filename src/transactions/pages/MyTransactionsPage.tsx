import { Receipt } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, EmptyState, LoadingBlock, PageHeader } from 'shell/ui';
import { useSession } from 'shell/useSession';
import { getMyTransactions } from '../api/transactions';
import { useRemote } from '../api/useRemote';
import { RetryAlert } from '../components/RetryAlert';
import { TransactionRow } from '../components/TransactionRow';
import styles from './MyTransactionsPage.module.css';

/** `?page=` of the address, 1 when missing or not a positive integer. */
function pageFrom(params: URLSearchParams): number {
  const page = Number(params.get('page'));
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** HU-TXN-001, E-42: the buyer's purchases or the producer's sales (the role decides which). */
export function MyTransactionsPage() {
  const role = useSession()?.user.role;
  if (role === 'PRODUCER') return <TransactionList title="Mis ventas" producer />;
  if (role === 'BUYER') return <TransactionList title="Mis compras" producer={false} />;
  return (
    <section className="stack">
      <PageHeader title="Transacciones" />
      <EmptyState
        icon={Receipt}
        title="Las compras y las ventas son de compradores y productores."
      />
    </section>
  );
}

function TransactionList({ title, producer }: { title: string; producer: boolean }) {
  const [params, setParams] = useSearchParams();
  const page = pageFrom(params);
  const { remote, reload } = useRemote((signal) => getMyTransactions(page, signal), String(page));
  const goTo = (target: number) => setParams({ page: String(target) });
  const lastPage = remote.state === 'data' ? remote.data.meta.totalPages : 0;
  const pastLast = remote.state === 'data' && remote.data.meta.total > 0 && page > lastPage;

  return (
    <section className="stack">
      <PageHeader title={title} subtitle="Las más recientes primero." />
      {remote.state === 'loading' && <LoadingBlock />}
      {remote.state === 'error' && <RetryAlert message={remote.error.message} onRetry={reload} />}
      {remote.state === 'data' && remote.data.meta.total === 0 && (
        <EmptyState
          icon={Receipt}
          title={producer ? 'Todavía no tiene ventas.' : 'Todavía no tiene compras.'}
          action={producer ? undefined : <Link to="/catalogo">Ver el catálogo</Link>}
        />
      )}
      {pastLast && (
        <EmptyState
          icon={Receipt}
          title={`La página ${page} no existe.`}
          action={<Link to={`?page=${lastPage}`}>Ir a la página {lastPage}</Link>}
        />
      )}
      {remote.state === 'data' && remote.data.meta.total > 0 && !pastLast && (
        <>
          <ul className={styles.list}>
            {remote.data.data.map((item) => (
              <TransactionRow
                key={item.id}
                item={item}
                other={producer ? item.buyerName : item.producerName}
              />
            ))}
          </ul>
          <nav className={styles.pager} aria-label={`Páginas de ${title.toLowerCase()}`}>
            <Button variant="secondary" disabled={page <= 1} onClick={() => goTo(page - 1)}>
              Anterior
            </Button>
            <span>
              Página {page} de {lastPage}
            </span>
            <Button variant="secondary" disabled={page >= lastPage} onClick={() => goTo(page + 1)}>
              Siguiente
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}
