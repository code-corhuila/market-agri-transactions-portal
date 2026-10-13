import { SearchX } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Breadcrumbs, Card, EmptyState, LoadingBlock, PageHeader } from 'shell/ui';
import { useSession } from 'shell/useSession';
import { getTransaction } from '../api/transactions';
import { useRemote } from '../api/useRemote';
import { RetryAlert } from '../components/RetryAlert';
import { formatDateTime, formatNumber, formatPesos } from '../model/money';
import { isTransactionId, statusBadge, unitName, type TransactionView } from '../model/transaction';
import { NotFoundPage } from './NotFoundPage';

/** While the payment is PENDING the page asks again (the webhook settles it, E-43). */
export const REFRESH_MS = 3_000;

/** Errors of E-41 that are an answer, not a failure: no retry, a way back instead. */
const ANSWERS = new Set(['TRANSACTION_NOT_FOUND', 'NOT_A_PARTICIPANT']);

/** HU-TXN-001, E-41: one transaction for its buyer or its producer. */
export function TransactionPage() {
  const id = useParams().id ?? '';
  return isTransactionId(id) ? <TransactionDetail id={id} /> : <NotFoundPage />;
}

function TransactionDetail({ id }: { id: string }) {
  const producer = useSession()?.user.role === 'PRODUCER';
  const { remote, reload } = useRemote((signal) => getTransaction(id, signal), id);
  const pending = remote.state === 'data' && remote.data.status === 'PENDING';

  useEffect(() => {
    if (!pending) return undefined;
    const timer = setTimeout(reload, REFRESH_MS);
    return () => clearTimeout(timer);
  }, [pending, remote, reload]);

  if (remote.state === 'loading') return <LoadingBlock />;
  if (remote.state === 'error' && ANSWERS.has(remote.error.error)) {
    return (
      <EmptyState
        icon={SearchX}
        title={remote.error.message}
        action={<Link to="/transacciones">Ver mis compras</Link>}
      />
    );
  }
  if (remote.state === 'error')
    return <RetryAlert message={remote.error.message} onRetry={reload} />;
  return <Detail item={remote.data} producer={producer} />;
}

function Detail({ item, producer }: { item: TransactionView; producer: boolean }) {
  const badge = statusBadge(item.status);
  return (
    <section className="stack">
      <Breadcrumbs
        items={[
          { label: producer ? 'Mis ventas' : 'Mis compras', to: '/transacciones' },
          { label: item.productName },
        ]}
      />
      <PageHeader
        title={item.productName}
        actions={<Badge variant={badge.variant}>{badge.label}</Badge>}
      />
      {item.status === 'FAILED' && (
        <EmptyState
          icon={SearchX}
          title="El pago no se completó."
          action={<Link to={`/transacciones/comprar/${item.productId}`}>Intentar de nuevo</Link>}
        />
      )}
      <Card>
        <dl className="stack-sm">
          <dt className="subtle">{producer ? 'Comprador' : 'Productor'}</dt>
          <dd>{producer ? item.buyerName : item.producerName}</dd>
          <dt className="subtle">Cantidad</dt>
          <dd>
            {formatNumber(item.quantity)} {unitName(item.unit, item.quantity !== 1)}
          </dd>
          <dt className="subtle">Precio por {unitName(item.unit)}</dt>
          <dd>{formatPesos(item.unitPrice)}</dd>
          <dt className="subtle">Total</dt>
          <dd>{formatPesos(item.amount, { suffix: true })}</dd>
          <dt className="subtle">Fecha de la compra</dt>
          <dd>{formatDateTime(item.createdAt)}</dd>
          {item.confirmedAt && (
            <>
              <dt className="subtle">Confirmada el</dt>
              <dd>{formatDateTime(item.confirmedAt)}</dd>
            </>
          )}
        </dl>
      </Card>
      {item.ledger && (
        <Card>
          <dl className="stack-sm">
            <dt className="subtle">Neto a recibir</dt>
            <dd>{formatPesos(item.ledger.netAmount)}</dd>
            <dt className="subtle">Desembolso</dt>
            <dd>Pendiente de desembolso</dd>
          </dl>
        </Card>
      )}
    </section>
  );
}
